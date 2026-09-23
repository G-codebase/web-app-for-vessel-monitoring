import { store, StoredAudit } from '../../database/inMemoryStore.js';

export type NewAuditEventInput = Omit<StoredAudit, 'eventId' | 'timestamp'>;

export class AuditService {
  public record(input: NewAuditEventInput): StoredAudit {
    const event: StoredAudit = {
      eventId: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      ...input,
    };
    store.audits.unshift(event);
    return event;
  }

  public getEvents(limit = 50, filterAction?: string) {
    if (filterAction && filterAction !== 'ALL') {
      return store.audits.filter((a) => a.action === filterAction).slice(0, limit);
    }
    return store.audits.slice(0, limit);
  }
}

export const auditService = new AuditService();
