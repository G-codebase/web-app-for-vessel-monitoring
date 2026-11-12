import { Router } from "express";
import { cloudService } from "./cloudService.js";
import { requireAuth, requireVesselAccess } from "../../middleware/auth.middleware.js";

export const cloudRouter = Router();

cloudRouter.use(requireAuth);

cloudRouter.get("/:id/cloud-connection", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const conn = await cloudService.getConnection(vesselId);
    res.json(conn);
  } catch (error) {
    next(error);
  }
});

cloudRouter.post("/:id/cloud-connection", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const conn = await cloudService.updateConnection(vesselId, req.body);
    res.json(conn);
  } catch (error) {
    next(error);
  }
});

cloudRouter.post("/:id/cloud-connection/test", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const result = await cloudService.testConnection(vesselId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

cloudRouter.post("/:id/cloud-connection/disconnect", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const conn = await cloudService.setStatus(vesselId, "DISCONNECTED", req.user);
    res.json(conn);
  } catch (error) {
    next(error);
  }
});

cloudRouter.post("/:id/cloud-connection/reconnect", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const conn = await cloudService.setStatus(vesselId, "CONNECTED", req.user);
    res.json(conn);
  } catch (error) {
    next(error);
  }
});
