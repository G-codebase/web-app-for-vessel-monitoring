import { store, VesselRecord } from '../../database/inMemoryStore.js';

export class FleetService {
  public getFleetSummary() {
    const online = store.vessels.filter((v) => v.status === 'ONLINE').length;
    const warning = store.vessels.filter((v) => v.status === 'WARNING').length;
    const critical = store.vessels.filter((v) => v.status === 'CRITICAL').length;
    const offline = store.vessels.filter((v) => v.status === 'OFFLINE').length;

    return {
      timestamp: new Date().toISOString(),
      counts: {
        total: store.vessels.length,
        online,
        warning,
        critical,
        offline,
      },
      vessels: store.vessels,
    };
  }

  public getAllVessels(): VesselRecord[] {
    return store.vessels;
  }
}

export const fleetService = new FleetService();
