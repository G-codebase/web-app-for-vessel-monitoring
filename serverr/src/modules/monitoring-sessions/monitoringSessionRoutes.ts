import { Router } from "express";
import { monitoringSessionService } from "./monitoringSessionService.js";
import { requireAuth, requireVesselAccess } from "../../middleware/auth.middleware.js";

export const monitoringSessionRouter = Router();

monitoringSessionRouter.use(requireAuth);

monitoringSessionRouter.get("/", async (req, res, next) => {
  try {
    const vesselId = req.query.vesselId as string | undefined;
    const sessions = await monitoringSessionService.listSessions(vesselId);
    res.json({ sessions, total: sessions.length });
  } catch (error) {
    next(error);
  }
});

monitoringSessionRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await monitoringSessionService.getSessionTelemetry(String(req.params.id));
    res.json(data);
  } catch (error: any) {
    if (error.message === "SESSION_NOT_FOUND") {
      res.status(404).json({ error: "SESSION_NOT_FOUND", message: "Monitoring session not found." });
      return;
    }
    next(error);
  }
});

monitoringSessionRouter.post("/start", async (req, res, next) => {
  try {
    const { vesselId, label, notes } = req.body;
    if (!vesselId) {
      res.status(400).json({ error: "VESSEL_ID_REQUIRED", message: "vesselId is required" });
      return;
    }
    const session = await monitoringSessionService.startSession({
      vesselId,
      userId: req.user!.id,
      label,
      notes,
    });
    res.status(201).json({ status: "SUCCESS", session });
  } catch (error) {
    next(error);
  }
});

monitoringSessionRouter.post("/:id/end", async (req, res, next) => {
  try {
    const session = await monitoringSessionService.endSession(String(req.params.id), req.user!.id);
    res.json({ status: "SUCCESS", session });
  } catch (error) {
    next(error);
  }
});
