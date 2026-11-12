import { Router } from "express";
import { telemetryService } from "./telemetryService.js";
import { requireAuth, requireVesselAccess } from "../../middleware/auth.middleware.js";

export const telemetryRouter = Router();

telemetryRouter.use(requireAuth);

// Ingest external cloud telemetry (supports array or single JSON message)
telemetryRouter.post("/:id/telemetry/ingest", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const actor = req.user
      ? {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.roles[0] || "OPERATOR",
        }
      : undefined;

    const result = await telemetryService.ingestExternalTelemetry(
      vesselId,
      req.body,
      actor
    );

    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        error: "MALFORMED_TELEMETRY_PAYLOAD",
        message: "Incoming telemetry does not match expected JSON schema.",
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

// Historical telemetry query
telemetryRouter.get("/:id/telemetry/history", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const filters = {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      category: req.query.category as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const data = await telemetryService.getHistoricalReadings(vesselId, filters);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Custom Date/Time Range CSV Export (User requirement)
telemetryRouter.get("/:id/telemetry/export-csv", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const filters = {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      category: req.query.category as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
    };

    const { filename, csvContent, rowCount } = await telemetryService.exportTelemetryCsv(
      vesselId,
      filters
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Row-Count", rowCount.toString());
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// Latest Telemetry Readings
telemetryRouter.get("/:id/telemetry/latest", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const readings = await telemetryService.getLatestReadings(vesselId);
    res.json({ readings, total: readings.length });
  } catch (error) {
    next(error);
  }
});

// Vessel Overview
telemetryRouter.get("/:id/overview", requireVesselAccess("id"), async (req, res, next) => {
  try {
    const vesselId = String(req.params.id);
    const overview = await telemetryService.getVesselOverview(vesselId);
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

