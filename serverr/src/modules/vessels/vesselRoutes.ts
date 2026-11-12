import { Router } from "express";
import { vesselService } from "./vesselService.js";
import { requireAuth, requireVesselAccess } from "../../middleware/auth.middleware.js";

export const vesselRouter = Router();

vesselRouter.use(requireAuth);

vesselRouter.get("/", async (req, res, next) => {
  try {
    const vessels = await vesselService.listVesselsForUser(
      req.user!.id,
      req.user!.isSuperOrAdmin
    );
    res.json({ vessels, total: vessels.length });
  } catch (error) {
    next(error);
  }
});

vesselRouter.get("/:id", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vessel = await vesselService.getVessel(String(req.params.id));
    res.json(vessel);
  } catch (error) {
    next(error);
  }
});

vesselRouter.get("/:id/tanks", requireVesselAccess("id"), (req, res) => {
  const tanks = vesselService.getVesselTanks(String(req.params.id));
  res.json(Object.values(tanks));
});

vesselRouter.get("/:id/draft", requireVesselAccess("id"), (req, res) => {
  const draft = vesselService.getVesselDraft(String(req.params.id));
  res.json(draft);
});

vesselRouter.get("/:id/manifolds", requireVesselAccess("id"), (req, res) => {
  const manifolds = vesselService.getVesselManifolds(String(req.params.id));
  res.json(manifolds);
});
