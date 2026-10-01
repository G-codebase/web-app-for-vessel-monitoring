import { store } from '../../database/inMemoryStore.js';

export class ReportsService {
  public generateDailyVesselReport(vesselId: string = 'VESSEL-001') {
    const vessel = store.getVessel(vesselId);
    const tanks = Object.values(store.getTanks(vesselId));
    const draft = store.getDraft(vesselId);
    const alarms = store.alarms.filter((a) => a.vesselId === vesselId);

    const tempValues = tanks.map((t) => t.temperatureC);
    const pressValues = tanks.map((t) => t.pressureMbar);

    const avgTemp = tempValues.length ? (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(2) : '20.00';
    const maxTemp = tempValues.length ? Math.max(...tempValues).toFixed(2) : '20.00';
    const minTemp = tempValues.length ? Math.min(...tempValues).toFixed(2) : '20.00';

    const avgPress = pressValues.length ? (pressValues.reduce((a, b) => a + b, 0) / pressValues.length).toFixed(2) : '12.00';
    const maxPress = pressValues.length ? Math.max(...pressValues).toFixed(2) : '12.00';
    const minPress = pressValues.length ? Math.min(...pressValues).toFixed(2) : '12.00';

    return {
      reportId: `REP-DLY-${Date.now().toString().slice(-6)}`,
      reportType: 'VESSEL_DAILY_OPERATIONS_REPORT',
      generatedAt: new Date().toISOString(),
      vessel: {
        vesselId: vessel.vesselId,
        name: vessel.name,
        imo: vessel.imo,
        type: vessel.type,
        flag: vessel.flag,
      },
      systemAvailabilityPct: vessel.status === 'OFFLINE' ? 94.20 : 99.98,
      cargoTotalVolumeM3: vessel.cargoVolumeM3,
      cargoFillPct: vessel.cargoFillPct,
      ballastVolumeM3: vessel.ballastVolumeM3,
      fuelVolumeM3: vessel.fuelVolumeM3,
      draft,
      temperatureStats: {
        averageC: parseFloat(avgTemp),
        maximumC: parseFloat(maxTemp),
        minimumC: parseFloat(minTemp),
      },
      pressureStats: {
        averageMbar: parseFloat(avgPress),
        maximumMbar: parseFloat(maxPress),
        minimumMbar: parseFloat(minPress),
      },
      tanks: tanks.map((t) => ({
        tankId: t.tankId,
        name: t.name,
        fillPct: t.fillingPercentage,
        volumeM3: t.volumeM3,
        temperatureC: t.temperatureC,
        pressureMbar: t.pressureMbar,
        flowRateM3H: t.flowRateM3H,
        status: t.status,
      })),
      alarms: alarms.map((a) => ({
        alarmId: a.alarmId,
        title: a.title,
        severity: a.severity,
        state: a.state,
        raisedAt: a.raisedAt,
      })),
    };
  }

  public exportDailyReportCsv(vesselId: string = 'VESSEL-001'): string {
    const report = this.generateDailyVesselReport(vesselId);
    let csv = `SJV MARINE TANKER MONITOR - DAILY COMPLIANCE REPORT\n`;
    csv += `Vessel,${report.vessel.name} (IMO: ${report.vessel.imo})\n`;
    csv += `Generated At,${report.generatedAt}\n`;
    csv += `System Availability,${report.systemAvailabilityPct}%\n\n`;

    csv += `CARGO TANKS SUMMARY\n`;
    csv += `Tank ID,Name,Fill %,Volume (m3),Temp (C),Pressure (mbar),Flow Rate (m3/h),Status\n`;
    for (const t of report.tanks) {
      csv += `${t.tankId},"${t.name}",${t.fillPct},${t.volumeM3},${t.temperatureC},${t.pressureMbar},${t.flowRateM3H},${t.status}\n`;
    }

    csv += `\nALARMS SUMMARY\n`;
    csv += `Alarm ID,Title,Severity,State,Raised At\n`;
    for (const a of report.alarms) {
      csv += `${a.alarmId},"${a.title}",${a.severity},${a.state},${a.raisedAt}\n`;
    }

    return csv;
  }
}

export const reportsService = new ReportsService();
