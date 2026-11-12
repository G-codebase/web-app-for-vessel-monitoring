import { prisma } from "../../database/prisma.js";
import { auditService } from "../audit/auditService.js";

export class MonitoringSessionService {
  public async listSessions(vesselId?: string) {
    const where = vesselId && vesselId !== "ALL" ? { vesselId } : {};

    const sessions = await prisma.monitoringSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            imoNumber: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return sessions.map((s) => {
      const startMs = s.startedAt.getTime();
      const endMs = s.endedAt ? s.endedAt.getTime() : Date.now();
      const durationMin = Math.round((endMs - startMs) / 60000);

      return {
        id: s.id,
        vesselId: s.vesselId,
        vesselName: s.vessel.name,
        vesselImo: s.vessel.imoNumber,
        label: s.label || `Monitoring Watch #${s.id.slice(0, 8)}`,
        operatorId: s.user.id,
        operatorName: `${s.user.firstName} ${s.user.lastName}`,
        operatorEmail: s.user.email,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() || null,
        durationMinutes: durationMin,
        readingsIngested: s.readingsIngested,
        alarmsTriggered: s.alarmsTriggered,
        cloudEndpoint: s.cloudEndpoint || "https://api.vesselcloud.net/v1/gateways/" + s.vesselId,
        notes: s.notes || "Live SCADA surveillance and telemetry sync session.",
        status: s.endedAt ? "COMPLETED" : "ACTIVE",
      };
    });
  }

  public async getSessionTelemetry(sessionId: string) {
    const session = await prisma.monitoringSession.findUnique({
      where: { id: sessionId },
      include: { vessel: true, user: true },
    });

    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    const start = session.startedAt;
    const end = session.endedAt || new Date();

    const readings = await prisma.telemetryReading.findMany({
      where: {
        vesselId: session.vesselId,
        eventTimestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { eventTimestamp: "asc" },
      take: 200,
    });

    return {
      session: {
        id: session.id,
        vesselId: session.vesselId,
        vesselName: session.vessel.name,
        label: session.label,
        operatorName: `${session.user.firstName} ${session.user.lastName}`,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        cloudEndpoint: session.cloudEndpoint,
      },
      readings,
    };
  }

  public async startSession(params: {
    vesselId: string;
    userId: string;
    label?: string;
    notes?: string;
  }) {
    const conn = await prisma.cloudConnection.findUnique({
      where: { vesselId: params.vesselId },
    });

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    const session = await prisma.monitoringSession.create({
      data: {
        vesselId: params.vesselId,
        userId: params.userId,
        cloudConnectionId: conn?.id,
        label: params.label || `Live SCADA Watch - ${new Date().toLocaleDateString()}`,
        startedAt: new Date(),
        cloudEndpoint: conn?.endpointUrl || `https://api.vesselcloud.net/v1/gateways/${params.vesselId}`,
        notes: params.notes,
      },
    });

    await auditService.record({
      userId: params.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Operator",
      userRole: "OPERATOR",
      action: "MONITORING_SESSION_STARTED",
      vesselId: params.vesselId,
      vesselName: params.vesselId,
      targetEntity: `MonitoringSession:${session.id}`,
      ipAddress: "127.0.0.1",
      details: `Started new vessel monitoring watch: ${session.label}.`,
    });

    return session;
  }

  public async endSession(sessionId: string, userId: string) {
    const session = await prisma.monitoringSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
      },
    });

    await auditService.record({
      userId,
      userName: "Operator",
      userRole: "OPERATOR",
      action: "MONITORING_SESSION_ENDED",
      vesselId: session.vesselId,
      vesselName: session.vesselId,
      targetEntity: `MonitoringSession:${sessionId}`,
      ipAddress: "127.0.0.1",
      details: `Concluded vessel monitoring watch: ${session.label}.`,
    });

    return session;
  }
}

export const monitoringSessionService = new MonitoringSessionService();
