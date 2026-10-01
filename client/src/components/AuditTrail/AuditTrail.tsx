import React, { useState, useEffect } from 'react';
import { Filter, ArrowRight, RefreshCw } from 'lucide-react';
import * as api from '../../services/api';

export const AuditTrail: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.fetchAuditEvents(actionFilter);
      setAudits(res);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    api.fetchAuditEvents(actionFilter)
      .then((res) => {
        if (isCurrent) setAudits(res);
      })
      .catch((err) => {
        console.error('Audit fetch error:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [actionFilter]);

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Maritime Regulatory Audit Trail
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Cryptographically logged immutable audit records of all operational setpoint changes, alarm acknowledgments, and operator actions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              id="audit-filter-dropdown"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                color: '#fff',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Recorded Actions</option>
              <option value="ALARM_ACKNOWLEDGE">Alarm Acknowledgment</option>
              <option value="ALARM_RESOLVE">Alarm Resolution</option>
              <option value="THRESHOLD_UPDATE">Threshold Modification</option>
              <option value="USER_ROLE_SWITCH">User Role Switching</option>
              <option value="REPORT_GENERATION">Report Generation</option>
            </select>
          </div>

          <button
            id="refresh-audit-btn"
            className="btn btn-ghost"
            style={{ padding: '6px 10px' }}
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className="data-table-container">
          <table className="data-table" id="audit-trail-table">
            <thead>
              <tr>
                <th>Event ID &amp; Timestamp</th>
                <th>Vessel Identity</th>
                <th>Operator Identity</th>
                <th>Role &amp; Rank</th>
                <th>Operational Action</th>
                <th>Target Subsystem</th>
                <th>State / Value Transition</th>
                <th>Station IP</th>
                <th>Details &amp; Notes</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((event) => (
                <tr key={event.eventId} id={`audit-row-${event.eventId.toLowerCase()}`}>
                  <td>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {event.eventId}
                    </div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(event.timestamp).toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '12px' }}>
                      {event.vesselName || event.vesselId}
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{event.vesselId}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{event.userName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{event.userId}</div>
                  </td>

                  <td>
                    <span className="badge badge-live" style={{ fontSize: '10px' }}>
                      {event.userRole}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--accent-amber)', fontSize: '12px' }}>
                      {event.action}
                    </span>
                  </td>

                  <td>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{event.targetEntity}</span>
                  </td>

                  <td>
                    {event.oldValue && event.newValue ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{event.oldValue}</span>
                        <ArrowRight size={11} color="var(--accent-cyan)" />
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{event.newValue}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Executed</span>
                    )}
                  </td>

                  <td className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {event.ipAddress}
                  </td>

                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                    {event.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
