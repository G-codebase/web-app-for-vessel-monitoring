import { store } from '../../database/inMemoryStore.js';

export class VesselService {
  public getVessel(vesselId: string) {
    return store.getVessel(vesselId);
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
