import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Table,
  Layers,
  Thermometer,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import * as api from '../../services/api';

export const HistoryExportView: React.FC = () => {
  const { currentVesselId, vessels } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || { name: 'MT Ocean Star' };

  // Date and Time inputs (defaults to last 24 hours)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);

  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [fromDateTime, setFromDateTime] = useState<string>(formatDateTimeLocal(yesterday));
  const [toDateTime, setToDateTime] = useState<string>(formatDateTimeLocal(now));
  const [category, setCategory] = useState<string>('ALL');
  const [deviceId, setDeviceId] = useState<string>('ALL');

  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<{ total: number; readings: any[] }>({
    total: 0,
    readings: [],
  });
  const [page, setPage] = useState<number>(0);
  const pageSize = 50;

  const loadHistory = async (offset = 0) => {
    try {
      setLoading(true);
      const res = await api.fetchTelemetryHistoryApi(currentVesselId, {
        from: fromDateTime ? new Date(fromDateTime).toISOString() : undefined,
        to: toDateTime ? new Date(toDateTime).toISOString() : undefined,
        category: category !== 'ALL' ? category : undefined,
        deviceId: deviceId !== 'ALL' ? deviceId : undefined,
        limit: pageSize,
        offset,
      });
      setHistoryData(res);
      setPage(offset / pageSize);
    } catch (err) {
      console.error('Failed to load telemetry history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(0);
  }, [currentVesselId, category, deviceId]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistory(0);
  };

  const handlePreset = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600 * 1000);
    setFromDateTime(formatDateTimeLocal(start));
    setToDateTime(formatDateTimeLocal(end));
    setTimeout(() => {
      loadHistory(0);
    }, 50);
  };

  const handleDownloadCsv = async () => {
    try {
      setExporting(true);
      await api.triggerCsvDownload(currentVesselId, {
        from: fromDateTime ? new Date(fromDateTime).toISOString() : undefined,
        to: toDateTime ? new Date(toDateTime).toISOString() : undefined,
        category: category !== 'ALL' ? category : undefined,
        deviceId: deviceId !== 'ALL' ? deviceId : undefined,
      });
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="telemetry-view-container">
      {/* View Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title">
            <FileText className="text-cyan inline-icon" size={24} />
            Telemetry History & Custom Time-Range CSV Generator
          </h2>
          <p className="view-subtitle">
            Query sensor readings by custom date & time windows and export temperature/pressure sensor data to CSV for{' '}
            <strong className="text-white">{currentVessel.name}</strong>
          </p>
        </div>

        <div className="view-actions-bar">
          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="btn btn-primary btn-md"
            title="Download CSV containing telemetry data for selected date & time window"
          >
            <Download size={16} />
            <span>{exporting ? 'Generating CSV...' : 'Generate & Download CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Date-Time Picker Box */}
      <div className="panel mb-4">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <SlidersHorizontal size={18} className="text-cyan" />
            <span className="font-semibold text-white">Date, Time & Sensor Filters</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => handlePreset(1)}
            >
              Last 1h
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => handlePreset(6)}
            >
              Last 6h
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => handlePreset(24)}
            >
              Last 24h
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => handlePreset(168)}
            >
              Last 7d
            </button>
          </div>
        </div>

        <div className="panel-body">
          <form onSubmit={handleApplyFilter} className="csv-filter-form">
            <div className="filter-grid">
              {/* Start Date & Time */}
              <div className="form-group">
                <label htmlFor="csv-from-time" className="filter-label">
                  <Calendar size={13} className="inline mr-1" />
                  From Date & Time (Start)
                </label>
                <input
                  id="csv-from-time"
                  type="datetime-local"
                  className="filter-input"
                  value={fromDateTime}
                  onChange={(e) => setFromDateTime(e.target.value)}
                  required
                />
              </div>

              {/* End Date & Time */}
              <div className="form-group">
                <label htmlFor="csv-to-time" className="filter-label">
                  <Clock size={13} className="inline mr-1" />
                  To Date & Time (End)
                </label>
                <input
                  id="csv-to-time"
                  type="datetime-local"
                  className="filter-input"
                  value={toDateTime}
                  onChange={(e) => setToDateTime(e.target.value)}
                  required
                />
              </div>

              {/* Category Filter */}
              <div className="form-group">
                <label htmlFor="csv-category" className="filter-label">
                  <Filter size={13} className="inline mr-1" />
                  Sensor Category
                </label>
                <select
                  id="csv-category"
                  className="filter-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Temperature">Temperature Sensors (°C)</option>
                  <option value="Pressure">Pressure Transducers (bar / mbar)</option>
                  <option value="Level">Level & Draft Gauges (m)</option>
                </select>
              </div>

              {/* Device ID Filter */}
              <div className="form-group">
                <label htmlFor="csv-device" className="filter-label">
                  <Search size={13} className="inline mr-1" />
                  Source Device
                </label>
                <select
                  id="csv-device"
                  className="filter-select"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                >
                  <option value="ALL">All Devices</option>
                  <option value="line1-pc">line1-pc (External Cloud Probe)</option>
                  <option value="line1-press-pc">line1-press-pc (Hydraulic Line)</option>
                  <option value="SENS-C05-PRESS-ULLAGE">SENS-C05 (Cargo Tank Ullage)</option>
                </select>
              </div>
            </div>

            <div className="flex-between mt-3 pt-3 border-t">
              <span className="text-xs text-muted">
                Matching rows: <strong className="text-white">{historyData.total.toLocaleString()}</strong> data points in database
              </span>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-secondary btn-sm" disabled={loading}>
                  <RefreshCw size={13} className={loading ? 'spin' : ''} />
                  <span>Apply Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={exporting || historyData.total === 0}
                  className="btn btn-primary btn-sm"
                >
                  <Download size={13} />
                  <span>{exporting ? 'Exporting...' : 'Export Filtered CSV'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Live Data Preview Table */}
      <div className="panel">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Table size={18} className="text-cyan" />
            <span className="font-semibold text-white">Sensor Data Points Preview</span>
          </div>
          <span className="text-xs text-muted">
            Showing {historyData.readings.length} of {historyData.total.toLocaleString()} points
          </span>
        </div>

        <div className="panel-body">
          {loading ? (
            <div className="p-8 text-center text-muted">
              <RefreshCw size={24} className="spin mb-2 mx-auto" />
              <p>Querying historical sensor telemetry...</p>
            </div>
          ) : historyData.readings.length === 0 ? (
            <div className="empty-state-box">
              <Table size={32} className="text-muted mb-2" />
              <p>No telemetry records found for the selected time window and category.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => handlePreset(168)}
              >
                Expand to Last 7 Days
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="scada-table scada-table-compact">
                  <thead>
                    <tr>
                      <th>Device ID</th>
                      <th>Category / Tag</th>
                      <th>Measured Value</th>
                      <th>Unit</th>
                      <th>Source State</th>
                      <th>Configured Limit</th>
                      <th>Delta Above Limit</th>
                      <th>Event Timestamp (UTC)</th>
                      <th>Ingestion Time (UTC)</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.readings.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <code className="code-badge">{r.deviceId}</code>
                        </td>
                        <td className="font-semibold text-white">
                          {r.tag.toLowerCase().includes('temp') ? (
                            <Thermometer size={13} className="text-cyan mr-1 inline" />
                          ) : (
                            <Gauge size={13} className="text-amber mr-1 inline" />
                          )}
                          {r.tag}
                        </td>
                        <td className="font-mono text-cyan font-bold text-sm">
                          {r.value.toFixed(2)}
                        </td>
                        <td>{r.unit || '—'}</td>
                        <td>
                          <span
                            className={`badge ${
                              r.sourceState === 'HIGH'
                                ? 'badge-critical'
                                : r.sourceState === 'WARNING'
                                ? 'badge-warning'
                                : 'badge-normal'
                            }`}
                          >
                            {r.sourceState || 'NORMAL'}
                          </span>
                        </td>
                        <td className="font-mono text-muted">
                          {r.sourceLimit !== null ? r.sourceLimit.toFixed(2) : '—'}
                        </td>
                        <td className="font-mono">
                          {r.differenceFromLimit !== null && r.differenceFromLimit > 0 ? (
                            <span className="text-danger font-semibold">
                              +{r.differenceFromLimit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="font-mono text-xs text-muted">
                          {new Date(r.eventTimestamp).toISOString().replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="font-mono text-xs text-muted">
                          {new Date(r.receivedAt).toISOString().replace('T', ' ').slice(0, 19)}
                        </td>
                        <td>
                          <span className="badge badge-live text-xs">
                            <CheckCircle2 size={11} className="mr-1 inline" />
                            {r.quality}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {historyData.total > pageSize && (
                <div className="flex-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted">
                    Page {page + 1} of {Math.ceil(historyData.total / pageSize)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary btn-xs"
                      disabled={page === 0}
                      onClick={() => loadHistory((page - 1) * pageSize)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-secondary btn-xs"
                      disabled={(page + 1) * pageSize >= historyData.total}
                      onClick={() => loadHistory((page + 1) * pageSize)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
