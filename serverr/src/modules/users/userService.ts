import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma.js";
import { auditService } from "../audit/auditService.js";

export class UserService {
  public async listUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        roles: {
          include: {
            role: true,
          },
        },
        vesselAccess: {
          include: {
            vessel: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username || u.email.split("@")[0],
      name: `${u.firstName} ${u.lastName}`.trim() || u.username || u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      roles: u.roles.map((r) => r.role.name),
      vessels: u.vesselAccess.map((va) => ({
        vesselId: va.vesselId,
        vesselName: va.vessel.name,
        level: va.level,
      })),
    }));
  }

  public async createUser(
    actor: { id: string; name: string; role: string },
    data: {
      email?: string;
      mailId?: string;
      username?: string;
      userName?: string;
      firstName?: string;
      lastName?: string;
      roleName?: string;
      vesselIds?: string[];
      password?: string;
      temporaryPassword?: string;
    }
  ) {
    const cleanEmail = (data.email || data.mailId || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("INVALID_EMAIL");
    }

    // Determine username - must be CAPITAL characters only
    const rawUsername = (
      data.username ||
      data.userName ||
      cleanEmail.split("@")[0]
    )
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");

    if (!/^[A-Z0-9_]+$/.test(rawUsername)) {
      throw new Error("USERNAME_MUST_BE_CAPITAL");
    }

    // Name resolution
    let firstName = (data.firstName || "").trim();
    let lastName = (data.lastName || "").trim();
    if (!firstName) {
      const parts = (data.userName || rawUsername).split(/[._\s]+/);
      firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Operator";
      lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "Staff";
    }
    if (!lastName) {
      lastName = "Officer";
    }

    // Check for duplicate email or username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: rawUsername }],
      },
    });
    if (existing) {
      if (existing.email === cleanEmail) {
        throw new Error("USER_ALREADY_EXISTS");
      }
      throw new Error("USERNAME_TAKEN");
    }

    const passwordToHash = data.password || data.temporaryPassword || "Welcome@2026!";
    if (passwordToHash.length < 6) {
      throw new Error("PASSWORD_TOO_SHORT");
    }
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const targetRole = await prisma.role.findUnique({
      where: { name: data.roleName || "OPERATOR" },
    });

    if (!targetRole) {
      throw new Error("ROLE_NOT_FOUND");
    }

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: rawUsername,
        firstName,
        lastName,
        passwordHash,
        status: "ACTIVE",
        roles: {
          create: {
            roleId: targetRole.id,
          },
        },
        vesselAccess:
          data.vesselIds && data.vesselIds.length > 0
            ? {
                create: data.vesselIds.map((vesselId) => ({
                  vesselId,
                  level: "OPERATE",
                })),
              }
            : undefined,
      },
      include: {
        roles: { include: { role: true } },
        vesselAccess: { include: { vessel: true } },
      },
    });

    await auditService.record({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: "USER_CREATED",
      vesselId: data.vesselIds?.[0] || "GLOBAL",
      vesselName: "User Directory",
      targetEntity: `User:${newUser.id}`,
      ipAddress: "127.0.0.1",
      details: `Administrator created user ${cleanEmail} (username: ${rawUsername}) with role ${targetRole.name}.`,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      name: `${newUser.firstName} ${newUser.lastName}`.trim(),
      role: targetRole.name,
      status: newUser.status,
      temporaryPassword: passwordToHash,
      vessels: newUser.vesselAccess.map((va) => ({
        vesselId: va.vesselId,
        vesselName: va.vessel.name,
      })),
    };
  }

  public async updateUserStatus(
    actor: { id: string; name: string; role: string },
    userId: string,
    status: "ACTIVE" | "DISABLED"
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await auditService.record({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DISABLED",
      vesselId: "GLOBAL",
      vesselName: "User Directory",
      targetEntity: `User:${userId}`,
      ipAddress: "127.0.0.1",
      details: `User ${user.email} status transitioned to ${status}.`,
    });

    return user;
  }
}

export const userService = new UserService();
