import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { store } from "../../database/inMemoryStore.js";
import { wsGateway } from "../../websocket/gateway.js";
import { auditService } from "../audit/auditService.js";

const singleReadingSchema = z.object({
  device_id: z.string().min(1),
  tag: z.string().min(1),
  state: z.string().nullable().optional(),
  value: z.number().finite(),
  limit: z.number().finite().nullable().optional(),
  message: z.string().nullable().optional(),
  timestamp: z.string(),
  unit: z.string().nullable().optional(),
});

const externalPayloadSchema = z.union([
  singleReadingSchema,
  z.array(singleReadingSchema),
]);

export class TelemetryService {
  public normalizeReading(vesselId: string, item: z.infer<typeof singleReadingSchema>) {
    const receivedAt = new Date().toISOString();
    const sourceLimit = item.limit ?? null;

    let parsedDate: Date;
    try {
      parsedDate = new Date(item.timestamp);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
    } catch {
      parsedDate = new Date();
    }

    const tagClean = item.tag.trim();
    let unit = item.unit || null;
    if (!unit) {
      const lower = tagClean.toLowerCase();
      if (lower.includes("temp")) unit = "°C";
      else if (lower.includes("press")) unit = "bar";
      else if (lower.includes("level") || lower.includes("draft")) unit = "m";
      else if (lower.includes("volume")) unit = "m³";
    }

    let quality: "GOOD" | "SUSPECT" | "BAD" | "UNKNOWN" = "GOOD";
    const ageMs = Date.now() - parsedDate.getTime();
    if (ageMs > 10 * 60 * 1000 || ageMs < -60 * 1000) {
      quality = "SUSPECT";
    }

    return {
      vesselId,
      deviceId: item.device_id,
      tag: tagClean,
      value: item.value,
      unit,
      sourceState: item.state || null,
      sourceLimit,
      sourceMessage: item.message || null,
      eventTimestamp: parsedDate.toISOString(),
      receivedAt,
      quality,
      differenceFromLimit: sourceLimit !== null ? parseFloat((item.value - sourceLimit).toFixed(2)) : null,
    };
  }

  public async ingestExternalTelemetry(vesselId: string, rawPayload: unknown, actor?: any) {
    const parsed = externalPayloadSchema.parse(rawPayload);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    const normalizedList = items.map((item) => this.normalizeReading(vesselId, item));

    // Batch insert into Prisma database
    for (const norm of normalizedList) {
      await prisma.telemetryReading.create({
        data: {
          vesselId,
          deviceId: norm.deviceId,
          tag: norm.tag,
          value: norm.value,
          unit: norm.unit,
          sourceState: norm.sourceState,
          sourceLimit: norm.sourceLimit,
          differenceFromLimit: norm.differenceFromLimit,
          sourceMessage: norm.sourceMessage,
          eventTimestamp: new Date(norm.eventTimestamp),
          receivedAt: new Date(norm.receivedAt),
          quality: norm.quality,
        },
      });

      // Update or create alarm if in HIGH/CRITICAL state
      if (norm.sourceState === "HIGH" || (norm.sourceLimit !== null && norm.value > norm.sourceLimit)) {
        await prisma.alarmRecord.create({
          data: {
            vesselId,
            deviceId: norm.deviceId,
            tag: norm.tag,
            severity: "CRITICAL",
            lifecycle: "ACTIVE",
            value: norm.value,
            sourceLimit: norm.sourceLimit,
            message: norm.sourceMessage || `${norm.tag} exceeded safety limit: ${norm.value} ${norm.unit || ""}`,
            firstOccurredAt: new Date(norm.eventTimestamp),
            lastOccurredAt: new Date(),
          },
        });
      }

      // Update in-memory store so live gauges react instantly
      if (norm.tag.toLowerCase().includes("temp")) {
        const tanks = store.getTanks(vesselId);
        if (tanks.C05) {
          tanks.C05.temperatureC = norm.value;
          tanks.C05.status = norm.sourceState === "HIGH" ? "CRITICAL" : "NORMAL";
        }
      } else if (norm.tag.toLowerCase().includes("press")) {
        const tanks = store.getTanks(vesselId);
        if (tanks.C05) {
          tanks.C05.pressureMbar = norm.value;
        }
      }
    }

    // Update cloud connection lastSyncAt and lastReadingAt
    await prisma.cloudConnection.updateMany({
      where: { vesselId },
      data: {
        lastSyncAt: new Date(),
        lastReadingAt: new Date(),
        status: "CONNECTED",
      },
    });

    // Broadcast live telemetry update over WebSocket
    wsGateway.broadcast({
      type: "CLOUD_INGESTION_UPDATE",
      vesselId,
      readings: normalizedList,
      timestamp: new Date().toISOString(),
    });

    if (actor) {
      await auditService.record({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: "CLOUD_TELEMETRY_INGEST",
        vesselId,
        vesselName: vesselId,
        targetEntity: `TelemetryBatch:${normalizedList.length} items`,
        ipAddress: "127.0.0.1",
        details: `Ingested ${normalizedList.length} external telemetry reading(s) from cloud gateway.`,
      });
    }

    return {
      status: "SUCCESS",
      ingestedCount: normalizedList.length,
      readings: normalizedList,
    };
  }

  public async getHistoricalReadings(vesselId: string, filters: {
    from?: string;
    to?: string;
    category?: string;
    deviceId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { vesselId };

    if (filters.from || filters.to) {
      where.eventTimestamp = {};
      if (filters.from) where.eventTimestamp.gte = new Date(filters.from);
      if (filters.to) where.eventTimestamp.lte = new Date(filters.to);
    }

    if (filters.category && filters.category !== "ALL") {
      where.tag = { contains: filters.category, mode: "insensitive" };
    }

    if (filters.deviceId && filters.deviceId !== "ALL") {
      where.deviceId = filters.deviceId;
    }

    const limit = filters.limit ? Math.min(filters.limit, 1000) : 100;
    const offset = filters.offset || 0;

    const [total, readings] = await Promise.all([
      prisma.telemetryReading.count({ where }),
      prisma.telemetryReading.findMany({
        where,
        orderBy: { eventTimestamp: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      total,
      limit,
      offset,
      readings: readings.map((r) => ({
        id: r.id,
        vesselId: r.vesselId,
        deviceId: r.deviceId,
        tag: r.tag,
        value: r.value,
        unit: r.unit,
        sourceState: r.sourceState,
        sourceLimit: r.sourceLimit,
        differenceFromLimit: r.differenceFromLimit,
        sourceMessage: r.sourceMessage,
        eventTimestamp: r.eventTimestamp.toISOString(),
        receivedAt: r.receivedAt.toISOString(),
        quality: r.quality,
      })),
    };
  }

  public async exportTelemetryCsv(vesselId: string, filters: {
    from?: string;
    to?: string;
    category?: string;
    deviceId?: string;
  }) {
    const where: any = { vesselId };

    if (filters.from || filters.to) {
      where.eventTimestamp = {};
      if (filters.from) where.eventTimestamp.gte = new Date(filters.from);
      if (filters.to) where.eventTimestamp.lte = new Date(filters.to);
    }

    if (filters.category && filters.category !== "ALL") {
      where.tag = { contains: filters.category, mode: "insensitive" };
    }

    if (filters.deviceId && filters.deviceId !== "ALL") {
      where.deviceId = filters.deviceId;
    }

    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    const vesselName = vessel?.name || vesselId;

    const readings = await prisma.telemetryReading.findMany({
      where,
      orderBy: { eventTimestamp: "asc" },
      take: 10000,
    });

    const headers = [
      "Vessel ID",
      "Vessel Name",
      "Device Identifier",
      "Measurement Tag",
      "Value",
      "Unit",
      "Source State",
      "Configured Limit",
      "Delta Above Limit",
      "Event Timestamp (UTC)",
      "Ingestion Timestamp (UTC)",
      "Quality Assessment",
      "Source System Message",
    ];

    const rows = readings.map((r) => [
      `"${r.vesselId}"`,
      `"${vesselName}"`,
      `"${r.deviceId}"`,
      `"${r.tag}"`,
      r.value.toFixed(2),
      `"${r.unit || ""}"`,
      `"${r.sourceState || "NORMAL"}"`,
      r.sourceLimit !== null ? r.sourceLimit.toFixed(2) : '""',
      r.differenceFromLimit !== null ? r.differenceFromLimit.toFixed(2) : '""',
      `"${r.eventTimestamp.toISOString()}"`,
      `"${r.receivedAt.toISOString()}"`,
      `"${r.quality}"`,
      `"${(r.sourceMessage || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const fromDateStr = filters.from ? filters.from.slice(0, 10) : "all";
    const toDateStr = filters.to ? filters.to.slice(0, 10) : "latest";
    const filename = `${vesselName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-telemetry-${fromDateStr}-to-${toDateStr}.csv`;

    return {
      filename,
      csvContent,
      rowCount: readings.length,
    };
  }

  public async getLatestReadings(vesselId: string) {
    const readings = await prisma.telemetryReading.findMany({
      where: { vesselId },
      orderBy: { eventTimestamp: "desc" },
      take: 20,
    });
    return readings;
  }

  public async getVesselOverview(vesselId: string) {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        cloudConnection: true,
        tanks: true,
        draftRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });
    const latestReadings = await prisma.telemetryReading.findMany({
      where: { vesselId },
      orderBy: { eventTimestamp: "desc" },
      take: 10,
    });
    const activeAlarms = await prisma.alarmRecord.count({
      where: { vesselId, lifecycle: "ACTIVE" },
    });
    return {
      vessel,
      latestReadings,
      activeAlarmsCount: activeAlarms,
      lastUpdated: latestReadings[0]?.eventTimestamp || new Date().toISOString(),
    };
  }
}

export const telemetryService = new TelemetryService();

