import { Request, Response, NextFunction } from "express";
import { prisma } from "../database/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles: string[];
        permissions: string[];
        vesselIds: string[];
        sessionId: string;
        isSuperOrAdmin: boolean;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({
        error: "AUTHENTICATION_REQUIRED",
        message: "A valid session token is required to access this resource.",
      });
      return;
    }

    const session = await prisma.authSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            vesselAccess: true,
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      res.status(401).json({
        error: "SESSION_EXPIRED",
        message: "Your session has expired or was revoked. Please sign in again.",
      });
      return;
    }

    if (session.user.status !== "ACTIVE") {
      res.status(403).json({
        error: "ACCOUNT_INACTIVE",
        message: "Your account is currently disabled or pending invitation activation.",
      });
      return;
    }

    // Refresh lastSeenAt asynchronously
    prisma.authSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {});

    const roles = session.user.roles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        session.user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code)
        )
      )
    );
    const vesselIds = session.user.vesselAccess.map((va) => va.vesselId);
    const isSuperOrAdmin = roles.some((r) =>
      ["SUPER_ADMIN", "ADMIN", "TESTER_ADMIN"].includes(r)
    );

    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      roles,
      permissions,
      vesselIds,
      sessionId: session.id,
      isSuperOrAdmin,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
      return;
    }

    if (req.user.isSuperOrAdmin || req.user.permissions.includes(permissionCode)) {
      next();
      return;
    }

    res.status(403).json({
      error: "PERMISSION_DENIED",
      message: `You do not have the required permission (${permissionCode}) for this action.`,
    });
  };
}

export function requireVesselAccess(paramKey: string = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
      return;
    }

    const requestedVesselId = req.params[paramKey] || req.query.vesselId;
    if (!requestedVesselId || typeof requestedVesselId !== "string") {
      next();
      return;
    }

    if (
      req.user.isSuperOrAdmin ||
      req.user.vesselIds.includes(requestedVesselId)
    ) {
      next();
      return;
    }

    res.status(403).json({
      error: "VESSEL_ACCESS_DENIED",
      message: `You are not authorized to monitor or modify vessel ${requestedVesselId}.`,
    });
  };
}
