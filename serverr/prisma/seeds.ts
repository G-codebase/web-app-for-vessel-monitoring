import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const roles = [
  {
    name: "SUPER_ADMIN",
    description: "Full system access including administration and security management.",
  },
  {
    name: "ADMIN",
    description: "Administrative access to users, vessels, monitoring and reports.",
  },
  {
    name: "OPERATOR",
    description: "Operational access to assigned vessels and monitoring functions.",
  },
  {
    name: "VIEWER",
    description: "Read-only access to assigned vessels and monitoring data.",
  },
];

const permissions = [
  {
    code: "user.read",
    description: "View users.",
  },
  {
    code: "user.create",
    description: "Create users.",
  },
  {
    code: "user.update",
    description: "Update user information.",
  },
  {
    code: "user.disable",
    description: "Enable or disable users.",
  },
  {
    code: "role.read",
    description: "View roles and permissions.",
  },
  {
    code: "role.assign",
    description: "Assign roles to users.",
  },
  {
    code: "vessel.read",
    description: "View assigned vessels.",
  },
  {
    code: "vessel.create",
    description: "Create vessels.",
  },
  {
    code: "vessel.update",
    description: "Update vessel information.",
  },
  {
    code: "vessel.access",
    description: "Manage user vessel access.",
  },
  {
    code: "telemetry.read",
    description: "View vessel telemetry.",
  },
  {
    code: "telemetry.manage",
    description: "Manage telemetry configuration.",
  },
  {
    code: "alarm.read",
    description: "View vessel alarms.",
  },
  {
    code: "alarm.manage",
    description: "Manage and acknowledge alarms.",
  },
  {
    code: "report.read",
    description: "View reports.",
  },
  {
    code: "report.export",
    description: "Export reports.",
  },
  {
    code: "audit.read",
    description: "View audit logs.",
  },
];

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: permissions.map((permission) => permission.code),

  ADMIN: [
    "user.read",
    "user.create",
    "user.update",
    "user.disable",
    "role.read",
    "role.assign",
    "vessel.read",
    "vessel.create",
    "vessel.update",
    "vessel.access",
    "telemetry.read",
    "telemetry.manage",
    "alarm.read",
    "alarm.manage",
    "report.read",
    "report.export",
    "audit.read",
  ],

  OPERATOR: [
    "vessel.read",
    "telemetry.read",
    "telemetry.manage",
    "alarm.read",
    "alarm.manage",
    "report.read",
    "report.export",
  ],

  VIEWER: [
    "vessel.read",
    "telemetry.read",
    "alarm.read",
    "report.read",
  ],
};

async function seedRbac() {
  console.log("Starting RBAC seed...");

  const permissionRecords = new Map<string, { id: string }>();

  for (const permission of permissions) {
    const record = await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {
        description: permission.description,
      },
      create: permission,
    });

    permissionRecords.set(permission.code, record);
  }

  const roleRecords = new Map<string, { id: string }>();

  for (const role of roles) {
    const record = await prisma.role.upsert({
      where: {
        name: role.name,
      },
      update: {
        description: role.description,
      },
      create: role,
    });

    roleRecords.set(role.name, record);
  }

  for (const [roleName, permissionCodes] of Object.entries(rolePermissions)) {
    const role = roleRecords.get(roleName);

    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    for (const permissionCode of permissionCodes) {
      const permission = permissionRecords.get(permissionCode);

      if (!permission) {
        throw new Error(`Permission not found: ${permissionCode}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("RBAC seed completed successfully.");
}

async function main() {
  try {
    await seedRbac();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("RBAC seed failed:", error);
  process.exitCode = 1;
});
