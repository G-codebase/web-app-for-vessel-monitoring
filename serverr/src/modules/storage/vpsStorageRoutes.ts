import { Router } from "express";
import { z } from "zod";
import { vpsStorageService } from "./vpsStorageService.js";
import { requireAuth, requireVesselAccess } from "../../middleware/auth.middleware.js";

export const vpsStorageRouter = Router();

vpsStorageRouter.use(requireAuth);

// List available VPS storage dates and allocated files
vpsStorageRouter.get("/:id/vps-storage/dates", requireVesselAccess("id"), (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const dates = vpsStorageService.listAvailableDates(vesselId);
    res.json({
      status: "SUCCESS",
      vesselId,
      totalFiles: dates.length,
      storageCluster: "VPS-CLOUD-STORAGE-NODE-01 (Singapore / Primary)",
      dates,
    });
  } catch (error) {
    next(error);
  }
});

// Render telemetry from specific allocated VPS storage file by date
vpsStorageRouter.get("/:id/vps-storage/telemetry", requireVesselAccess("id"), (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const requestedDate = (req.query.date as string) || "2026-10-12";
    const telemetry = vpsStorageService.getTelemetryForDate(vesselId, requestedDate);
    res.json({
      status: "SUCCESS",
      renderedFrom: "VPS_STORAGE_ALLOCATED_FILE",
      telemetry,
    });
  } catch (error) {
    next(error);
  }
});

const allocateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  operationalContext: z.string().optional(),
  c05Temp: z.number().optional(),
  c05Press: z.number().optional(),
  c05Status: z.enum(["NORMAL", "WARNING", "CRITICAL"]).optional(),
  draftFore: z.number().optional(),
  draftAft: z.number().optional(),
});

// Allocate custom date file on VPS storage
vpsStorageRouter.post("/:id/vps-storage/allocate", requireVesselAccess("id"), (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const body = allocateSchema.parse(req.body);
    const actor = {
      id: req.user!.id,
      name: `${req.user!.firstName} ${req.user!.lastName}`,
      role: req.user!.roles[0] || "OPERATOR",
    };

    const payload = vpsStorageService.allocateCustomDate(actor, vesselId, body);
    res.status(201).json({
      status: "SUCCESS",
      message: `VPS storage file ${payload.allocatedFileName} allocated successfully.`,
      payload,
    });
  } catch (error) {
    next(error);
  }
});
