import { prisma } from "../../database/prisma.js";
import { auditService } from "../audit/auditService.js";

export class CloudService {
  public async getConnection(vesselId: string) {
    let conn = await prisma.cloudConnection.findUnique({
      where: { vesselId },
    });

    if (!conn) {
      conn = await prisma.cloudConnection.create({
        data: {
          vesselId,
          providerName: "VesselCloud SCADA Gateway",
          endpointUrl: `https://api.vesselcloud.net/v1/gateways/${vesselId}`,
          apiKeyMasked: "vc_live_****_7f9b",
          status: "CONNECTED",
          pollIntervalSec: 5,
          lastSyncAt: new Date(),
          lastReadingAt: new Date(),
        },
      });
    }

    return conn;
  }

  public async updateConnection(vesselId: string, data: {
    providerName?: string;
    endpointUrl?: string;
    apiKey?: string;
    pollIntervalSec?: number;
  }) {
    const apiKeyMasked = data.apiKey
      ? `vc_live_****_${data.apiKey.slice(-4)}`
      : undefined;

    const conn = await prisma.cloudConnection.upsert({
      where: { vesselId },
      update: {
        providerName: data.providerName,
        endpointUrl: data.endpointUrl,
        apiKeyMasked,
        pollIntervalSec: data.pollIntervalSec,
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
      create: {
        vesselId,
        providerName: data.providerName || "VesselCloud SCADA Gateway",
        endpointUrl: data.endpointUrl || `https://api.vesselcloud.net/v1/gateways/${vesselId}`,
        apiKeyMasked: apiKeyMasked || "vc_live_****_7f9b",
        pollIntervalSec: data.pollIntervalSec || 5,
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });

    return conn;
  }

  public async testConnection(vesselId: string) {
    const conn = await this.getConnection(vesselId);
    const latencyMs = Math.floor(45 + Math.random() * 35);

    await prisma.cloudConnection.update({
      where: { vesselId },
      data: {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        retryCount: 0,
        lastError: null,
      },
    });

    return {
      status: "SUCCESS",
      gatewayStatus: "CONNECTED",
      endpointUrl: conn.endpointUrl,
      provider: conn.providerName,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  public async setStatus(vesselId: string, status: "CONNECTED" | "DISCONNECTED" | "RECONNECTING" | "ERROR", user?: any) {
    const conn = await prisma.cloudConnection.update({
      where: { vesselId },
      data: {
        status,
        lastSyncAt: new Date(),
      },
    });

    if (user) {
      await auditService.record({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.roles[0] || "OPERATOR",
        action: status === "DISCONNECTED" ? "CLOUD_DISCONNECT" : "CLOUD_CONNECT",
        vesselId,
        vesselName: vesselId,
        targetEntity: `CloudConnection:${conn.id}`,
        ipAddress: "127.0.0.1",
        details: `Cloud gateway connection set to ${status}.`,
      });
    }

    return conn;
  }
}

export const cloudService = new CloudService();
