import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma.js";
import { auditService } from "../audit/auditService.js";

const APPROVED_EMAIL_DOMAINS = ["sjvmarine.com", "marine-tech.org", "tanker-ops.com"];

export class AuthService {
  public validateCompanyEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    const parts = clean.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return APPROVED_EMAIL_DOMAINS.includes(domain);
  }

  public async login(params: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const cleanInput = params.email.trim().toLowerCase();

    // Find by either email or username (case-insensitive for both)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: "insensitive" } },
          { username: { equals: cleanInput, mode: "insensitive" } },
        ],
      },
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
        vesselAccess: {
          include: {
            vessel: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("ACCOUNT_INACTIVE");
    }

    const isMatch = await bcrypt.compare(params.password, user.passwordHash);
    if (!isMatch) {
      await auditService.record({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.roles[0]?.role.name || "UNASSIGNED",
        action: "LOGIN_FAILED",
        vesselId: "N/A",
        vesselName: "Security Gateway",
        targetEntity: "AuthSession",
        ipAddress: params.ipAddress || "127.0.0.1",
        details: `Failed sign-in attempt with incorrect password for identifier ${cleanInput}.`,
      });
      throw new Error("INVALID_CREDENTIALS");
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        token,
        userAgent: params.userAgent || "Browser Client",
        ipAddress: params.ipAddress || "127.0.0.1",
        expiresAt,
      },
    });

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code)
        )
      )
    );
    const assignedVessels = user.vesselAccess.map((va) => ({
      vesselId: va.vesselId,
      name: va.vessel.name,
      level: va.level,
    }));

    await auditService.record({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: roles[0] || "OPERATOR",
      action: "LOGIN_SUCCESS",
      vesselId: assignedVessels[0]?.vesselId || "ALL",
      vesselName: assignedVessels[0]?.name || "Fleet Console",
      targetEntity: `AuthSession:${session.id}`,
      ipAddress: params.ipAddress || "127.0.0.1",
      details: `User signed in successfully with identifier ${cleanInput} as role ${roles.join(", ")}.`,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username || user.email.split("@")[0],
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        roles,
        permissions,
        assignedVessels,
      },
    };
  }

  public async logout(token: string, userId?: string) {
    if (!token) return;

    await prisma.authSession.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });

    if (userId) {
      await auditService.record({
        userId,
        userName: "Signed In User",
        userRole: "USER",
        action: "LOGOUT",
        vesselId: "N/A",
        vesselName: "Security Gateway",
        targetEntity: "AuthSession",
        ipAddress: "127.0.0.1",
        details: "User terminated active authentication session.",
      });
    }
  }

  public async getSessions(userId: string, currentSessionId: string) {
    const sessions = await prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  public async revokeSession(sessionId: string, userId: string) {
    await prisma.authSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });

    await auditService.record({
      userId,
      userName: "User",
      userRole: "OPERATOR",
      action: "SESSION_REVOKED",
      vesselId: "N/A",
      vesselName: "Security Gateway",
      targetEntity: `AuthSession:${sessionId}`,
      ipAddress: "127.0.0.1",
      details: `Terminated remote session ${sessionId}.`,
    });
  }

  public async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");

    const valid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!valid) throw new Error("INVALID_CURRENT_PASSWORD");

    if (newPass.length < 6) {
      throw new Error("PASSWORD_TOO_WEAK");
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await auditService.record({
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: "USER",
      action: "PASSWORD_CHANGED",
      vesselId: "N/A",
      vesselName: "Security Gateway",
      targetEntity: `User:${userId}`,
      ipAddress: "127.0.0.1",
      details: "User updated their authentication credentials.",
    });
  }
}

export const authService = new AuthService();
