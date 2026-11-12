import "dotenv/config";
import bcrypt from "bcryptjs";
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
    name: "TESTER_ADMIN",
    description: "Testing-environment administrator with full application permissions.",
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
  { code: "user.read", description: "View users." },
  { code: "user.create", description: "Create users." },
  { code: "user.update", description: "Update user information." },
  { code: "user.disable", description: "Enable or disable users." },
  { code: "role.read", description: "View roles and permissions." },
  { code: "role.assign", description: "Assign roles to users." },
  { code: "vessel.read", description: "View assigned vessels." },
  { code: "vessel.create", description: "Create vessels." },
  { code: "vessel.update", description: "Update vessel information." },
  { code: "vessel.access", description: "Manage user vessel access." },
  { code: "cloud.manage", description: "Manage cloud connections." },
  { code: "telemetry.read", description: "View vessel telemetry." },
  { code: "telemetry.manage", description: "Manage telemetry configuration." },
  { code: "alarm.read", description: "View vessel alarms." },
  { code: "alarm.manage", description: "Manage and acknowledge alarms." },
  { code: "report.read", description: "View reports." },
  { code: "report.export", description: "Export CSV and analytical reports." },
  { code: "audit.read", description: "View audit logs." },
  { code: "session.read", description: "View monitoring sessions." },
  { code: "session.manage", description: "Manage monitoring sessions." },
];

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: permissions.map((p) => p.code),
  TESTER_ADMIN: permissions.map((p) => p.code),
  ADMIN: [
    "user.read", "user.create", "user.update", "user.disable",
    "role.read", "role.assign", "vessel.read", "vessel.create",
    "vessel.update", "vessel.access", "cloud.manage", "telemetry.read",
    "telemetry.manage", "alarm.read", "alarm.manage", "report.read",
    "report.export", "audit.read", "session.read", "session.manage",
  ],
  OPERATOR: [
    "vessel.read", "cloud.manage", "telemetry.read", "telemetry.manage",
    "alarm.read", "alarm.manage", "report.read", "report.export",
    "session.read", "session.manage",
  ],
  VIEWER: [
    "vessel.read", "telemetry.read", "alarm.read", "report.read",
    "report.export", "session.read",
  ],
};

const defaultVessels = [
  {
    id: "VESSEL-001",
    name: "MT Ocean Star",
    imoNumber: "9876543",
    status: "ACTIVE" as const,
  },
  {
    id: "VESSEL-002",
    name: "MT Pacific Dawn",
    imoNumber: "9753124",
    status: "ACTIVE" as const,
  },
  {
    id: "VESSEL-003",
    name: "MT Marine One",
    imoNumber: "9642819",
    status: "ACTIVE" as const,
  },
  {
    id: "VESSEL-004",
    name: "MT Southern Sea",
    imoNumber: "9531742",
    status: "ACTIVE" as const,
  },
];

async function seedRbac() {
  console.log("Seeding RBAC roles and permissions...");

  const permissionRecords = new Map<string, { id: string }>();
  for (const permission of permissions) {
    const record = await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
    permissionRecords.set(permission.code, record);
  }

  const roleRecords = new Map<string, { id: string }>();
  for (const role of roles) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    roleRecords.set(role.name, record);
  }

  for (const [roleName, permissionCodes] of Object.entries(rolePermissions)) {
    const role = roleRecords.get(roleName);
    if (!role) continue;

    for (const permissionCode of permissionCodes) {
      const permission = permissionRecords.get(permissionCode);
      if (!permission) continue;

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

  console.log("RBAC roles & permissions seeded.");
  return roleRecords;
}

async function seedVessels() {
  console.log("Seeding default vessels...");
  for (const v of defaultVessels) {
    await prisma.vessel.upsert({
      where: { id: v.id },
      update: { name: v.name, imoNumber: v.imoNumber, status: v.status },
      create: v,
    });

    // Cloud connection config
    await prisma.cloudConnection.upsert({
      where: { vesselId: v.id },
      update: {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        lastReadingAt: new Date(),
      },
      create: {
        vesselId: v.id,
        providerName: "VesselCloud SCADA Gateway",
        endpointUrl: `https://api.vesselcloud.net/v1/gateways/${v.id}`,
        apiKeyMasked: "vc_live_****_7f9b",
        status: "CONNECTED",
        pollIntervalSec: 5,
        lastSyncAt: new Date(),
        lastReadingAt: new Date(),
      },
    });
  }

  // Seed tanks for MT Ocean Star
  const tanks = [
    { tankCode: "C01", name: "Cargo Tank 1P", type: "CARGO" as const, capacityM3: 28500, maxLevelM: 22.0, currentLevelM: 16.4, temperatureC: 24.2, pressureMbar: 8.5 },
    { tankCode: "C02", name: "Cargo Tank 1S", type: "CARGO" as const, capacityM3: 28500, maxLevelM: 22.0, currentLevelM: 16.2, temperatureC: 24.0, pressureMbar: 8.4 },
    { tankCode: "C03", name: "Cargo Tank 2P", type: "CARGO" as const, capacityM3: 31200, maxLevelM: 22.5, currentLevelM: 19.8, temperatureC: 25.1, pressureMbar: 11.2 },
    { tankCode: "C04", name: "Cargo Tank 2S", type: "CARGO" as const, capacityM3: 31200, maxLevelM: 22.5, currentLevelM: 19.6, temperatureC: 24.9, pressureMbar: 10.9 },
    { tankCode: "C05", name: "Cargo Tank 3P (High Alert)", type: "CARGO" as const, capacityM3: 32000, maxLevelM: 22.5, currentLevelM: 21.2, temperatureC: 82.5, pressureMbar: 24.5 },
    { tankCode: "C06", name: "Cargo Tank 3S", type: "CARGO" as const, capacityM3: 32000, maxLevelM: 22.5, currentLevelM: 17.5, temperatureC: 26.0, pressureMbar: 9.8 },
    { tankCode: "B01", name: "Ballast Water Fore Peak", type: "BALLAST" as const, capacityM3: 4200, maxLevelM: 14.0, currentLevelM: 3.1, temperatureC: 18.2, pressureMbar: 1.2 },
    { tankCode: "B02", name: "Ballast Water Aft Peak", type: "BALLAST" as const, capacityM3: 3800, maxLevelM: 12.0, currentLevelM: 2.8, temperatureC: 19.0, pressureMbar: 1.1 },
    { tankCode: "B03", name: "Wing Tank Port Ballast", type: "BALLAST" as const, capacityM3: 8400, maxLevelM: 18.0, currentLevelM: 4.5, temperatureC: 18.5, pressureMbar: 1.5 },
    { tankCode: "B04", name: "Wing Tank Stbd Ballast", type: "BALLAST" as const, capacityM3: 8400, maxLevelM: 18.0, currentLevelM: 4.4, temperatureC: 18.6, pressureMbar: 1.5 },
  ];

  for (const t of tanks) {
    await prisma.tankConfig.upsert({
      where: {
        vesselId_tankCode: {
          vesselId: "VESSEL-001",
          tankCode: t.tankCode,
        },
      },
      update: {
        currentLevelM: t.currentLevelM,
        temperatureC: t.temperatureC,
        pressureMbar: t.pressureMbar,
      },
      create: {
        vesselId: "VESSEL-001",
        ...t,
      },
    });
  }

  // Seed initial draft record
  const existingDraft = await prisma.vesselDraftRecord.findFirst({
    where: { vesselId: "VESSEL-001" },
  });
  if (!existingDraft) {
    await prisma.vesselDraftRecord.create({
      data: {
        vesselId: "VESSEL-001",
        foreDraftM: 4.85,
        midPortDraftM: 4.87,
        midStbdDraftM: 4.88,
        aftDraftM: 4.90,
        meanDraftM: 4.87,
        trimM: 0.05,
        heelDeg: 0.1,
        displacementTons: 68400,
      },
    });
  }
}

async function seedUsers(roleRecords: Map<string, { id: string }>) {
  console.log("Seeding administrator and operator accounts...");

  const testerAdminPassword = await bcrypt.hash("TesterAdmin@2026!", 10);
  const operatorPassword = await bcrypt.hash("Operator@2026!", 10);

  // 1. Tester Admin (TESTER_ADMIN)
  const testerAdmin = await prisma.user.upsert({
    where: { email: "tester.admin@sjvmarine.com" },
    update: {
      passwordHash: testerAdminPassword,
      status: "ACTIVE",
      firstName: "Tester",
      lastName: "Administrator",
    },
    create: {
      email: "tester.admin@sjvmarine.com",
      passwordHash: testerAdminPassword,
      firstName: "Tester",
      lastName: "Administrator",
      status: "ACTIVE",
    },
  });

  const testerRole = roleRecords.get("TESTER_ADMIN");
  if (testerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: testerAdmin.id,
          roleId: testerRole.id,
        },
      },
      update: {},
      create: {
        userId: testerAdmin.id,
        roleId: testerRole.id,
      },
    });
  }

  // Grant Tester Admin MANAGE access to all vessels
  for (const v of defaultVessels) {
    await prisma.vesselAccess.upsert({
      where: {
        userId_vesselId: {
          userId: testerAdmin.id,
          vesselId: v.id,
        },
      },
      update: { level: "MANAGE" },
      create: {
        userId: testerAdmin.id,
        vesselId: v.id,
        level: "MANAGE",
      },
    });
  }

  // 2. Vessel Operator (OPERATOR)
  const operator = await prisma.user.upsert({
    where: { email: "operator@sjvmarine.com" },
    update: {
      passwordHash: operatorPassword,
      status: "ACTIVE",
      firstName: "Deck",
      lastName: "Operator",
    },
    create: {
      email: "operator@sjvmarine.com",
      passwordHash: operatorPassword,
      firstName: "Deck",
      lastName: "Operator",
      status: "ACTIVE",
    },
  });

  const operatorRole = roleRecords.get("OPERATOR");
  if (operatorRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: operator.id,
          roleId: operatorRole.id,
        },
      },
      update: {},
      create: {
        userId: operator.id,
        roleId: operatorRole.id,
      },
    });
  }

  // Assign operator to VESSEL-001 and VESSEL-002
  for (const vesselId of ["VESSEL-001", "VESSEL-002"]) {
    await prisma.vesselAccess.upsert({
      where: {
        userId_vesselId: {
          userId: operator.id,
          vesselId,
        },
      },
      update: { level: "OPERATE" },
      create: {
        userId: operator.id,
        vesselId,
        level: "OPERATE",
      },
    });
  }

  // 3. Seed Monitoring Sessions (Before connected vessel clouds history)
  console.log("Seeding historical monitoring sessions...");
  const pastSession = await prisma.monitoringSession.findFirst({
    where: { vesselId: "VESSEL-001" },
  });

  if (!pastSession) {
    const conn = await prisma.cloudConnection.findUnique({
      where: { vesselId: "VESSEL-001" },
    });

    await prisma.monitoringSession.create({
      data: {
        vesselId: "VESSEL-001",
        userId: testerAdmin.id,
        cloudConnectionId: conn?.id,
        label: "Bunkering & Cargo Transfer Watch - Session #104",
        startedAt: new Date(Date.now() - 24 * 3600 * 1000),
        endedAt: new Date(Date.now() - 18 * 3600 * 1000),
        readingsIngested: 4320,
        alarmsTriggered: 3,
        cloudEndpoint: "https://api.vesselcloud.net/v1/gateways/VESSEL-001",
        notes: "Verified cargo tank level rise rate and manifold pressure stability.",
      },
    });

    await prisma.monitoringSession.create({
      data: {
        vesselId: "VESSEL-001",
        userId: operator.id,
        cloudConnectionId: conn?.id,
        label: "Coastal Transit & Stability Surveillance - Session #105",
        startedAt: new Date(Date.now() - 12 * 3600 * 1000),
        endedAt: new Date(Date.now() - 2 * 3600 * 1000),
        readingsIngested: 3600,
        alarmsTriggered: 1,
        cloudEndpoint: "https://api.vesselcloud.net/v1/gateways/VESSEL-001",
        notes: "Logged ballast exchange sequence and draft stability compliance.",
      },
    });

    await prisma.monitoringSession.create({
      data: {
        vesselId: "VESSEL-002",
        userId: testerAdmin.id,
        label: "Suez Transit Cloud Stream - Session #201",
        startedAt: new Date(Date.now() - 36 * 3600 * 1000),
        endedAt: new Date(Date.now() - 30 * 3600 * 1000),
        readingsIngested: 2160,
        alarmsTriggered: 0,
        cloudEndpoint: "https://api.vesselcloud.net/v1/gateways/VESSEL-002",
        notes: "Routine telemetry ingest from Mediterranean anchor station.",
      },
    });
  }

  // 4. Seed initial telemetry data (including the user sample JSON)
  const existingTelemetry = await prisma.telemetryReading.findFirst({
    where: { vesselId: "VESSEL-001", deviceId: "line1-pc" },
  });

  if (!existingTelemetry) {
    console.log("Seeding baseline telemetry readings including user sample...");
    const baseDate = new Date(Date.now() - 3600 * 1000);

    // Ingest the user sample reading
    await prisma.telemetryReading.create({
      data: {
        vesselId: "VESSEL-001",
        deviceId: "line1-pc",
        tag: "Temperature",
        value: 82.5,
        unit: "°C",
        sourceState: "HIGH",
        sourceLimit: 80.0,
        differenceFromLimit: 2.5,
        sourceMessage: "Temperature above high limit: 82.5 °C (limit 80 °C)",
        eventTimestamp: new Date("2026-10-07T17:41:21.678Z"),
        receivedAt: new Date(),
        quality: "GOOD",
      },
    });

    // Ingest associated critical alarm
    await prisma.alarmRecord.create({
      data: {
        vesselId: "VESSEL-001",
        deviceId: "line1-pc",
        tag: "Temperature",
        severity: "CRITICAL",
        lifecycle: "ACTIVE",
        value: 82.5,
        sourceLimit: 80.0,
        message: "Temperature above high limit: 82.5 °C (limit 80 °C)",
        firstOccurredAt: new Date("2026-10-07T17:41:21.678Z"),
        lastOccurredAt: new Date(),
      },
    });

    // Ingest a series of temperature and pressure points across the last 6 hours
    for (let i = 0; i <= 36; i++) {
      const pointTime = new Date(baseDate.getTime() + i * 10 * 60 * 1000);
      const tempVal = 78.0 + Math.sin(i / 5) * 4 + (i > 25 ? 3 : 0);
      const pressVal = 12.0 + Math.cos(i / 4) * 3;

      await prisma.telemetryReading.create({
        data: {
          vesselId: "VESSEL-001",
          deviceId: "line1-pc",
          tag: "Temperature",
          value: parseFloat(tempVal.toFixed(1)),
          unit: "°C",
          sourceState: tempVal > 80 ? "HIGH" : "NORMAL",
          sourceLimit: 80.0,
          differenceFromLimit: tempVal > 80 ? parseFloat((tempVal - 80).toFixed(1)) : null,
          sourceMessage: tempVal > 80 ? `Temperature above high limit: ${tempVal.toFixed(1)} °C` : null,
          eventTimestamp: pointTime,
          receivedAt: new Date(pointTime.getTime() + 120),
          quality: "GOOD",
        },
      });

      await prisma.telemetryReading.create({
        data: {
          vesselId: "VESSEL-001",
          deviceId: "line1-press-pc",
          tag: "Pressure",
          value: parseFloat(pressVal.toFixed(2)),
          unit: "bar",
          sourceState: pressVal > 14 ? "HIGH" : "NORMAL",
          sourceLimit: 14.0,
          differenceFromLimit: pressVal > 14 ? parseFloat((pressVal - 14).toFixed(2)) : null,
          sourceMessage: pressVal > 14 ? `Line pressure above high limit: ${pressVal.toFixed(2)} bar` : null,
          eventTimestamp: pointTime,
          receivedAt: new Date(pointTime.getTime() + 150),
          quality: "GOOD",
        },
      });
    }
  }

  console.log("Seeding completed successfully.");
}

async function main() {
  try {
    const roleRecords = await seedRbac();
    await seedVessels();
    await seedUsers(roleRecords);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed execution failed:", error);
  process.exitCode = 1;
});
