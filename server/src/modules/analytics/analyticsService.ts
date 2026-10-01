import { store, TimeSeriesPoint } from '../../database/inMemoryStore.js';

export type MetricAnalysis = {
  current: number;
  average: number;
  maximum: number;
  minimum: number;
  range: number;
  change: number;
  trend: 'Rising' | 'Falling' | 'Stable';
  rateOfChangePerHour: number;
  thresholdEvents: number;
  dataAvailabilityPct: number;
  unit: string;
};

export type CombinedTankAnalytics = {
  tankId: string;
  tankName: string;
  temperature: MetricAnalysis;
  pressure: MetricAnalysis;
  level: {
    currentLevelM: number;
    maxLevelM: number;
    fillingPercentage: number;
    volumeM3: number;
    capacityM3: number;
    flowRateM3H: number;
    volumeChange24hM3: number;
    ullageM: number;
    densityTM3: number;
  };
  timeSeries: TimeSeriesPoint[];
};

export class AnalyticsService {
  public getTankAnalytics(tankId: string, range: string = '24H', vesselId: string = 'VESSEL-001'): CombinedTankAnalytics | null {
    const vesselTanks = store.getTanks(vesselId);
    const tank = vesselTanks[tankId] || Object.values(vesselTanks)[0];
    if (!tank) return null;

    const fullSeries = store.getTimeSeries(vesselId, tank.tankId);
    let points = [...fullSeries];

    // Downsample or filter according to range
    if (range === '1H') {
      points = points.slice(-6); // last 1 hour (10m step)
    } else if (range === '6H') {
      points = points.slice(-36);
    } else if (range === '12H') {
      points = points.slice(-72);
    } else {
      points = points.slice(-144); // 24H
    }

    const temps = points.map((p) => p.temp);
    const pressures = points.map((p) => p.pressure);

    const tempAvg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : tank.temperatureC;
    const tempMax = temps.length ? Math.max(...temps) : tank.temperatureC;
    const tempMin = temps.length ? Math.min(...temps) : tank.temperatureC;
    const tempChange = temps.length > 1 ? temps[temps.length - 1] - temps[0] : 0;
    const tempTrend: 'Rising' | 'Falling' | 'Stable' =
      tempChange > 0.3 ? 'Rising' : tempChange < -0.3 ? 'Falling' : 'Stable';

    const pressAvg = pressures.length ? pressures.reduce((a, b) => a + b, 0) / pressures.length : tank.pressureMbar;
    const pressMax = pressures.length ? Math.max(...pressures) : tank.pressureMbar;
    const pressMin = pressures.length ? Math.min(...pressures) : tank.pressureMbar;
    const pressChange = pressures.length > 1 ? pressures[pressures.length - 1] - pressures[0] : 0;
    const pressTrend: 'Rising' | 'Falling' | 'Stable' =
      pressChange > 0.4 ? 'Rising' : pressChange < -0.4 ? 'Falling' : 'Stable';

    const firstVol = points.length > 0 ? points[0].volume : tank.volumeM3;
    const volumeChange24h = tank.volumeM3 - firstVol;

    const tankAlarms = store.alarms.filter((a) => a.vesselId === vesselId && a.locationId === tank.tankId);

    return {
      tankId: tank.tankId,
      tankName: tank.name,
      temperature: {
        current: tank.temperatureC,
        average: parseFloat(tempAvg.toFixed(2)),
        maximum: parseFloat(tempMax.toFixed(2)),
        minimum: parseFloat(tempMin.toFixed(2)),
        range: parseFloat((tempMax - tempMin).toFixed(2)),
        change: parseFloat(tempChange.toFixed(2)),
        trend: tempTrend,
        rateOfChangePerHour: parseFloat((tempChange / 24).toFixed(2)),
        thresholdEvents: tankAlarms.filter((a) => a.subsystem === 'CARGO' && a.unit === '°C').length,
        dataAvailabilityPct: 99.98,
        unit: '°C',
      },
      pressure: {
        current: tank.pressureMbar,
        average: parseFloat(pressAvg.toFixed(2)),
        maximum: parseFloat(pressMax.toFixed(2)),
        minimum: parseFloat(pressMin.toFixed(2)),
        range: parseFloat((pressMax - pressMin).toFixed(2)),
        change: parseFloat(pressChange.toFixed(2)),
        trend: pressTrend,
        rateOfChangePerHour: parseFloat((pressChange / 24).toFixed(2)),
        thresholdEvents: tankAlarms.filter((a) => a.unit === 'mbar').length,
        dataAvailabilityPct: 99.98,
        unit: 'mbar',
      },
      level: {
        currentLevelM: tank.currentLevelM,
        maxLevelM: tank.maxLevelM,
        fillingPercentage: tank.fillingPercentage,
        volumeM3: tank.volumeM3,
        capacityM3: tank.capacityM3,
        flowRateM3H: tank.flowRateM3H,
        volumeChange24hM3: parseFloat(volumeChange24h.toFixed(0)),
        ullageM: tank.ullageM,
        densityTM3: tank.densityTM3,
      },
      timeSeries: points,
    };
  }
}

export const analyticsService = new AnalyticsService();
