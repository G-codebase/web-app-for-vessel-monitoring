import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, CheckCircle, Ship } from 'lucide-react';

export const ReportsCenter: React.FC = () => {
  const [report, setReport] = useState<any>(null);

  const fetchDailyReport = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/reports/daily?vesselId=VESSEL-001').then((r) => r.json());
      setReport(res);
    } catch (err) {
      console.error('Report fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, []);

  const handleDownloadCsv = () => {
    window.open('http://localhost:3001/api/reports/daily/csv?vesselId=VESSEL-001', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report) return <div className="content-container">Loading Compliance Report...</div>;

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Operational &amp; Compliance Reporting
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Standardized daily tanker logs, IMO statutory summaries, and tank thermal/inert gas integrity records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button id="download-report-csv-btn" className="btn btn-primary" onClick={handleDownloadCsv}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button id="print-report-btn" className="btn btn-ghost" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Report Document Sheet */}
      <div className="glass-panel" style={{ background: '#0a101d', border: '1px solid var(--border-medium)', padding: '36px' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>
              SJV MARINE OPERATIONS PLATFORM
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              VESSEL DAILY OPERATIONS REPORT
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Report ID: {report.reportId} • Date: {new Date(report.generatedAt).toUTCString().slice(0, 16)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{report.vessel.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>IMO {report.vessel.imo} • Flag: {report.vessel.flag}</div>
            <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '4px' }}>
              Data Availability: {report.systemAvailabilityPct}%
            </div>
          </div>
        </div>

        {/* Operational Statistics Rollup */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL CARGO</div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {report.cargoTotalVolumeM3.toLocaleString()} m³
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-amber)' }}>{report.cargoFillPct}% Full</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MEAN DRAUGHT &amp; TRIM</div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {report.draft?.meanDraftM?.toFixed(2) || '4.85'} m
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>
              Trim: +{report.draft?.trimM?.toFixed(2) || '0.05'} m
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MEAN CARGO TEMP</div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {report.temperatureStats.averageC} °C
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Max: {report.temperatureStats.maximumC}° | Min: {report.temperatureStats.minimumC}°
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AVG ULLAGE PRESSURE</div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {report.pressureStats.averageMbar} mbar
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Peak: {report.pressureStats.maximumMbar} mbar
            </div>
          </div>
        </div>

        {/* Tanks Breakdown Table */}
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
          CARGO TANKS OPERATIONAL STATUS LOG
        </h3>
        <div className="data-table-container" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tank ID</th>
                <th>Compartment Name</th>
                <th>Filling Ratio</th>
                <th>Sounding Volume</th>
                <th>Cargo Temp</th>
                <th>Ullage Pressure</th>
                <th>Transfer Flow</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {report.tanks.map((t: any) => (
                <tr key={t.tankId}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{t.tankId}</td>
                  <td>{t.name}</td>
                  <td className="mono">{t.fillPct}%</td>
                  <td className="mono">{Math.round(t.volumeM3).toLocaleString()} m³</td>
                  <td className="mono">{t.temperatureC.toFixed(1)} °C</td>
                  <td className="mono">{t.pressureMbar.toFixed(1)} mbar</td>
                  <td className="mono" style={{ color: t.flowRateM3H > 0 ? 'var(--accent-emerald)' : 'inherit' }}>
                    {t.flowRateM3H > 0 ? `+${t.flowRateM3H.toFixed(1)}` : '0.0'} m³/h
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'CRITICAL' ? 'badge-critical' : t.status === 'WARNING' ? 'badge-warning' : 'badge-live'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alarms in reporting cycle */}
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
          INCIDENTS &amp; ALARMS IN REPORTING CYCLE
        </h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alarm ID</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Raised Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {report.alarms.map((a: any) => (
                <tr key={a.alarmId}>
                  <td className="mono" style={{ fontWeight: 700 }}>{a.alarmId}</td>
                  <td>{a.title}</td>
                  <td>
                    <span className={`badge ${a.severity === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.state}</td>
                  <td className="mono">{new Date(a.raisedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
