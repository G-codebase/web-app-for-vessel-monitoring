export type VesselType = 'VLCC' | 'SUEZMAX' | 'AFRAMAX' | 'PRODUCT_CARRIER' | 'CHEMICAL_TANKER';

export type VesselConnectivityStatus = 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export type VesselSummary = {
  vesselId: string;
  imo: number;
  name: string;
  type: VesselType;
  flag: string;
  callSign: string;
  dwt: number;
  status: VesselConnectivityStatus;
  lastDataTimestamp: string;
  latencySec: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  cargoVolumeM3: number;
  cargoCapacityM3: number;
  cargoFillPct: number;
  ballastVolumeM3: number;
  fuelVolumeM3: number;
  meanDraftM: number;
};

export type TankDefinition = {
  tankId: string;
  name: string;
  section: 'FORE' | 'MID' | 'AFT' | 'SLOP';
  type: 'CARGO' | 'BALLAST' | 'FUEL';
  capacityM3: number;
  maxLevelM: number;
  radarSensorId: string;
  tempSensors: { top: string; mid: string; btm: string };
  pressureSensorId: string;
};

export type VesselDigitalTwin = {
  vesselId: string;
  imo: number;
  name: string;
  type: VesselType;
  flag: string;
  lengthOverallM: number;
  beamM: number;
  maxDraftM: number;
  cargoCapacityM3: number;
  ballastCapacityM3: number;
  fuelCapacityM3: number;
  tanks: TankDefinition[];
};
