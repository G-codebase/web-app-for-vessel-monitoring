import { store } from '../../database/inMemoryStore.js';

export class TelemetryService {
  public getVesselSnapshot(vesselId: string) {
    const vessel = store.getVessel(vesselId);
    const tanks = store.getTanks(vesselId);
    const draft = store.getDraft(vesselId);
    const manifolds = store.getManifolds(vesselId);

    return {
      vesselId,
      vessel,
      tanks,
      draft,
      manifolds,
      timestamp: new Date().toISOString(),
    };
  }
}

export const telemetryService = new TelemetryService();
