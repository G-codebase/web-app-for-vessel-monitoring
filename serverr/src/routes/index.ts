import { Router } from "express";
import { verifyDatabaseConnection } from "../database/prisma.js";
import { authRouter } from "../modules/auth/authRoutes.js";
import { userRouter } from "../modules/users/userRoutes.js";
import { vesselRouter } from "../modules/vessels/vesselRoutes.js";
import { cloudRouter } from "../modules/cloud/cloudRoutes.js";
import { telemetryRouter } from "../modules/telemetry/telemetryRoutes.js";
import { monitoringSessionRouter } from "../modules/monitoring-sessions/monitoringSessionRoutes.js";
import { alarmRouter } from "../modules/alarms/alarmRoutes.js";
import { auditRouter } from "../modules/audit/auditRoutes.js";
import { vpsStorageRouter } from "../modules/storage/vpsStorageRoutes.js";

export const apiRouter = Router();

// Health & Liveness
apiRouter.get("/health/live", (_req, res) => {
  res.json({
    status: "UP",
    service: "tanker-vessel-monitor-api",
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get("/health/ready", async (req, res) => {
  try {
    await verifyDatabaseConnection();
    res.json({
      status: "READY",
      service: "tanker-vessel-monitor-api",
      dependencies: {
        database: "UP",
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "NOT_READY",
      service: "tanker-vessel-monitor-api",
      dependencies: {
        database: "DOWN",
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// Primary Domain Sub-Routers
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/vessels", vesselRouter);
apiRouter.use("/vessels", cloudRouter);
apiRouter.use("/vessels", telemetryRouter);
apiRouter.use("/vessels", vpsStorageRouter);
apiRouter.use("/monitoring-sessions", monitoringSessionRouter);
apiRouter.use("/alarms", alarmRouter);
apiRouter.use("/audit", auditRouter);
