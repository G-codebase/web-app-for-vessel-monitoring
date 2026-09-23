export const SENSOR_TYPES = [
  'TEMPERATURE',
  'PRESSURE',
  'LEVEL',
  'VOLUME',
  'DENSITY',
  'FLOW_RATE',
  'DRAFT',
  'TRIM',
  'HEEL',
] as const;

export type SensorType = (typeof SENSOR_TYPES)[number];

export const QUALITY_FLAGS = [
  'GOOD',
  'UNCERTAIN',
  'BAD',
  'COMM_FAILURE',
  'STALE',
] as const;

export type QualityFlag = (typeof QUALITY_FLAGS)[number];

export const SUBSYSTEM_TYPES = [
  'CARGO',
  'BALLAST',
  'FUEL',
  'MANIFOLD',
  'HULL',
  'INERT_GAS',
] as const;

export type SubsystemType = (typeof SUBSYSTEM_TYPES)[number];

export const ENGINEERING_UNITS = {
  TEMPERATURE: '°C',
  PRESSURE_MBAR: 'mbar',
  PRESSURE_BAR: 'bar',
  LEVEL_METER: 'm',
  PERCENT: '%',
  VOLUME_M3: 'm³',
  DENSITY: 't/m³',
  FLOW_RATE: 'm³/h',
  ANGLE_DEG: '°',
} as const;

export type EngineeringUnit = (typeof ENGINEERING_UNITS)[keyof typeof ENGINEERING_UNITS];
