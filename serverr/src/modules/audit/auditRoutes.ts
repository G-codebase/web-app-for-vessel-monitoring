import { Router } from "express";
import { auditService } from "./auditService.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

export const auditRouter = Router();

auditRouter.use(requireAuth);

auditRouter.get("/", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const action = req.query.action as string | undefined;
  res.json(auditService.getEvents(limit, action));
});

auditRouter.post("/", (req, res) => {
  const { action, vesselId, vesselName, targetEntity, oldValue, newValue, details } = req.body;
  const recorded = auditService.record({
    userId: req.user?.id || "USR-ANON",
    userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : "User",
    userRole: req.user?.roles[0] || "OPERATOR",
    action: action || "OPERATOR_ACTION",
    vesselId: vesselId || "VESSEL-001",
    vesselName: vesselName || "MT Ocean Star",
    targetEntity: targetEntity || "System Console",
    oldValue,
    newValue,
    ipAddress: req.ip || "127.0.0.1",
    details: details || "Operator action logged.",
  });
  res.json(recorded);
});
