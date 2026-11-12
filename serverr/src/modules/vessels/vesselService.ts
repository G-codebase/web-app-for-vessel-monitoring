import { prisma } from '../../database/prisma.js';
import { store } from '../../database/inMemoryStore.js';

export class VesselService {
  public async listVesselsForUser(userId: string, isSuperOrAdmin: boolean) {
    if (isSuperOrAdmin) {
      const vessels = await prisma.vessel.findMany({
        include: {
          cloudConnection: true,
        },
        orderBy: { name: 'asc' },
      });

      return vessels.map((v) => {
        const memVessel = store.getVessel(v.id);
        return {
          id: v.id,
          vesselId: v.id,
          name: v.name,
          imo: v.imoNumber ? parseInt(v.imoNumber, 10) : memVessel.imo,
          status: memVessel.status,
          type: memVessel.type,
          cloudStatus: v.cloudConnection?.status || 'CONNECTED',
          lastDataTimestamp: memVessel.lastDataTimestamp,
          latencySec: memVessel.latencySec,
          activeAlertsCount: memVessel.activeAlertsCount,
          criticalAlertsCount: memVessel.criticalAlertsCount,
          cargoFillPct: memVessel.cargoFillPct,
          meanDraftM: memVessel.meanDraftM,
          accessLevel: 'MANAGE',
        };
      });
    }

    const accessList = await prisma.vesselAccess.findMany({
      where: { userId },
      include: {
        vessel: {
          include: {
            cloudConnection: true,
          },
        },
      },
    });

    return accessList.map((va) => {
      const v = va.vessel;
      const memVessel = store.getVessel(v.id);
      return {
        id: v.id,
        vesselId: v.id,
        name: v.name,
        imo: v.imoNumber ? parseInt(v.imoNumber, 10) : memVessel.imo,
        status: memVessel.status,
        type: memVessel.type,
        cloudStatus: v.cloudConnection?.status || 'CONNECTED',
        lastDataTimestamp: memVessel.lastDataTimestamp,
        latencySec: memVessel.latencySec,
        activeAlertsCount: memVessel.activeAlertsCount,
        criticalAlertsCount: memVessel.criticalAlertsCount,
        cargoFillPct: memVessel.cargoFillPct,
        meanDraftM: memVessel.meanDraftM,
        accessLevel: va.level,
      };
    });
  }

  public async getVessel(vesselId: string) {
    const memVessel = store.getVessel(vesselId);
    const dbVessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: { cloudConnection: true },
    });

    return {
      ...memVessel,
      dbStatus: dbVessel?.status,
      cloudConnection: dbVessel?.cloudConnection,
    };
  }

  public getVesselTanks(vesselId: string) {
    return store.getTanks(vesselId);
  }

  public getVesselDraft(vesselId: string) {
    return store.getDraft(vesselId);
  }

  public getVesselManifolds(vesselId: string) {
    return store.getManifolds(vesselId);
  }
}

export const vesselService = new VesselService();
