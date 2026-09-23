import { WebSocketServer, WebSocket } from 'ws';
import { store } from '../database/inMemoryStore.js';
import { alarmEngine } from '../modules/alarms/alarmEngine.js';

export class WebSocketGateway {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public init(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial state snapshot immediately
      const initialPayload = {
        type: 'SNAPSHOT',
        timestamp: new Date().toISOString(),
        vessels: store.vessels,
        tanks: store.tanks,
        draft: store.draft,
        manifolds: store.manifolds,
        alarms: store.alarms,
        alarmStats: alarmEngine.getSummaryStats(),
      };
      ws.send(JSON.stringify(initialPayload));

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  public broadcast(data: any) {
    if (this.clients.size === 0) return;
    const msg = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  public broadcastAlarm(alarm: any) {
    this.broadcast({
      type: 'ALARM_RAISED',
      alarm,
      alarmStats: alarmEngine.getSummaryStats(),
    });
  }
}

export const wsGateway = new WebSocketGateway();
