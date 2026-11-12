import { Router } from "express";
import { alarmEngine } from "./alarmEngine.js";
import { wsGateway } from "../../websocket/gateway.js";
import { requireAuth, requireVesselAccess } from "../../middleware/auth.middleware.js";

export const alarmRouter = Router();

alarmRouter.use(requireAuth);

alarmRouter.get("/", async (req, res) => {
  const vesselId = req.query.vesselId as string | undefined;
  const alarms = alarmEngine.getAlarms(vesselId);
  const stats = alarmEngine.getSummaryStats(vesselId);
  res.json({ alarms, stats });
});

alarmRouter.post("/:id/acknowledge", async (req, res) => {
  const { notes } = req.body;
  const user = req.user
    ? {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.roles[0] || "OPERATOR",
      }
    : { userId: "USR-01", name: "Operator", role: "OPERATOR" };

  const updated = alarmEngine.acknowledgeAlarm(req.params.id, user, notes);
  if (!updated) {
    res.status(404).json({ error: "Alarm not found" });
    return;
  }

  wsGateway.broadcast({
    type: "ALARM_UPDATED",
    alarm: updated,
    alarmStats: alarmEngine.getSummaryStats(),
  });

  res.json(updated);
});

alarmRouter.post("/:id/resolve", async (req, res) => {
  const { notes } = req.body;
  const user = req.user
    ? {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.roles[0] || "OPERATOR",
      }
    : { userId: "USR-01", name: "Operator", role: "OPERATOR" };

  const updated = alarmEngine.resolveAlarm(req.params.id, user, notes);
  if (!updated) {
    res.status(404).json({ error: "Alarm not found" });
    return;
  }

  wsGateway.broadcast({
    type: "ALARM_UPDATED",
    alarm: updated,
    alarmStats: alarmEngine.getSummaryStats(),
  });

  res.json(updated);
});
