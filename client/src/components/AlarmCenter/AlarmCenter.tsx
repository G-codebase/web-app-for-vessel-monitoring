import React, { useState } from 'react';
import { useTelemetry, AlarmItem } from '../../context/TelemetryContext';
import {
  AlertTriangle,
  ShieldAlert,
  Bell,
  CheckCircle2,
  Check,
} from 'lucide-react';

export const AlarmCenter: React.FC = () => {
  const { alarms, alarmStats, acknowledgeAlarm, resolveAlarm, currentUser, vessels } = useTelemetry();
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmItem | null>(null);
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'RESOLVE' | null>(null);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [vesselFilter, setVesselFilter] = useState<string>('ALL');

  const filteredAlarms = alarms.filter((a) => {
    if (vesselFilter === 'ALL') return true;
    return a.vesselId === vesselFilter;
  });

  const handleOpenActionModal = (alarm: AlarmItem, type: 'ACKNOWLEDGE' | 'RESOLVE') => {
    setSelectedAlarm(alarm);
    setActionType(type);
    setOperatorNotes(
      type === 'ACKNOWLEDGE'
        ? `Verified telemetry loop. Purge procedure checked.`
        : `Pressure stabilized within normal threshold envelope.`
    );
  };

  const handleConfirmAction = async () => {
    if (!selectedAlarm || !actionType) return;
    if (actionType === 'ACKNOWLEDGE') {
      await acknowledgeAlarm(selectedAlarm.alarmId, operatorNotes);
    } else {
      await resolveAlarm(selectedAlarm.alarmId, operatorNotes);
    }
    setSelectedAlarm(null);
    setActionType(null);
    setOperatorNotes('');
  };

  return (
    <div className="content-container">
      {/* Alarm Center Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Maritime Alarm &amp; Event Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Static limits and dynamic Rate-of-Change (ROC) anomaly evaluation with audited lifecycle tracking.
          </p>
        </div>

        {/* Vessel Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filter Vessel:</span>
          <select
            id="alarm-vessel-filter"
            value={vesselFilter}
            onChange={(e) => setVesselFilter(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: '#fff',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Vessels ({alarms.length} alarms)</option>
            {vessels.map((v) => (
              <option key={v.vesselId} value={v.vesselId}>
                {v.name} ({alarms.filter((a) => a.vesselId === v.vesselId).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <div className="kpi-title">
            <ShieldAlert size={16} color="var(--accent-rose)" />
            CRITICAL SEVERITY
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>
            {alarmStats.criticalCount}
          </div>
          <div className="kpi-subtext">Immediate action required</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div className="kpi-title">
            <AlertTriangle size={16} color="var(--accent-amber)" />
            WARNING ADVISORIES
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {alarmStats.warningCount}
          </div>
          <div className="kpi-subtext">Operational thresholds reached</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="kpi-title">
            <Bell size={16} color="var(--accent-cyan)" />
            ACTIVE TOTAL
          </div>
          <div className="kpi-value">{alarmStats.activeCount}</div>
          <div className="kpi-subtext">Requires resolution</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="kpi-title">
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            ACKNOWLEDGED
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {alarmStats.acknowledgedCount}
          </div>
          <div className="kpi-subtext">Operator confirmed</div>
        </div>
      </div>

      {/* Alarms Table */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
            Active Alarms &amp; Security Events
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Auto-refreshing via SCADA WebSocket Gateway • Showing {filteredAlarms.length} events
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table" id="alarms-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Vessel &amp; Alarm Title</th>
                <th>Location / Sensor</th>
                <th>Rule Type</th>
                <th>Measured Value</th>
                <th>Raised Timestamp</th>
                <th>State &amp; Attribution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlarms.map((alarm) => {
                const isCritical = alarm.severity === 'CRITICAL';
                const isAck = alarm.state === 'ACTIVE_ACKNOWLEDGED';
                const isResolved = alarm.state === 'RESOLVED';
                const vessel = vessels.find((v) => v.vesselId === alarm.vesselId);
                const vesselLabel = vessel ? vessel.name : alarm.vesselId;

                return (
                  <tr key={alarm.alarmId} id={`alarm-row-${alarm.alarmId.toLowerCase()}`}>
                    <td>
                      <span
                        className={`badge ${
                          isCritical
                            ? 'badge-critical'
                            : alarm.severity === 'WARNING'
                            ? 'badge-warning'
                            : 'badge-live'
                        }`}
                      >
                        <span className={`status-dot ${isCritical ? 'critical' : 'warning'}`} />
                        {alarm.severity}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {vesselLabel}
                      </div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{alarm.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {alarm.message}
                      </div>
                      {alarm.rateOfChange && (
                        <div
                          style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            padding: '2px 6px',
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: 'var(--accent-rose)',
                            fontSize: '10px',
                            fontWeight: 700,
                            borderRadius: '4px',
                          }}
                        >
                          ROC: {alarm.rateOfChange}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {alarm.locationId}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {alarm.sensorId}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {alarm.ruleType}
                      </span>
                    </td>

                    <td className="mono" style={{ fontSize: '12px' }}>
                      <span style={{ color: isCritical ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 700 }}>
                        {alarm.currentValue} {alarm.unit}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Limit: {alarm.thresholdValue} {alarm.unit}
                      </div>
                    </td>

                    <td className="mono" style={{ fontSize: '11px' }}>
                      {new Date(alarm.raisedAt).toISOString().slice(11, 19)} UTC
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isResolved
                            ? 'var(--accent-emerald)'
                            : isAck
                            ? 'var(--accent-cyan)'
                            : 'var(--accent-rose)',
                        }}
                      >
                        {alarm.state}
                      </span>
                      {alarm.acknowledgedBy && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          By: {alarm.acknowledgedBy}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isAck && !isResolved && (
                          <button
                            id={`ack-alarm-${alarm.alarmId.toLowerCase()}`}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenActionModal(alarm, 'ACKNOWLEDGE')}
                          >
                            <Check size={12} />
                            <span>Ack</span>
                          </button>
                        )}
                        {!isResolved && (
                          <button
                            id={`resolve-alarm-${alarm.alarmId.toLowerCase()}`}
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenActionModal(alarm, 'RESOLVE')}
                          >
                            <CheckCircle2 size={12} />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acknowledge / Resolve Confirmation Modal */}
      {selectedAlarm && actionType && (
        <div className="tank-drawer-overlay">
          <div
            className="glass-panel"
            style={{
              width: '460px',
              margin: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {actionType === 'ACKNOWLEDGE' ? 'Acknowledge Alarm' : 'Resolve Alarm'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Confirm your operational response. This action will be permanently recorded in the immutable audit trail.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px' }}>
              <div><strong>Alarm:</strong> {selectedAlarm.title} ({selectedAlarm.alarmId})</div>
              <div><strong>Vessel:</strong> {selectedAlarm.vesselId}</div>
              <div><strong>Operator:</strong> {currentUser.name} ({currentUser.rank})</div>
              <div><strong>Role:</strong> {currentUser.role}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                Operational Notes / Corrective Actions:
              </label>
              <textarea
                id="alarm-action-notes-input"
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  padding: '8px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                id="cancel-alarm-action-btn"
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedAlarm(null);
                  setActionType(null);
                }}
              >
                Cancel
              </button>
              <button
                id="confirm-alarm-action-btn"
                className="btn btn-primary"
                onClick={handleConfirmAction}
              >
                Confirm &amp; Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
