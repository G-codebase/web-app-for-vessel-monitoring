import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Thermometer,
  Gauge,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const TelemetryWorkspace: React.FC<{ initialTankId?: string }> = ({
  initialTankId = 'C05',
}) => {
  const { tanks } = useTelemetry();
  const [selectedTank, setSelectedTank] = useState(initialTankId);
  const [timeRange, setTimeRange] = useState('24H');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/vessels/VESSEL-001/tanks/${selectedTank}/analytics?range=${timeRange}`
      ).then((r) => r.json());
      setAnalyticsData(res);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTank, timeRange]);

  // Render or update ECharts instance
  useEffect(() => {
    if (!chartRef.current || !analyticsData || !analyticsData.timeSeries) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const seriesData = analyticsData.timeSeries;
    const timestamps = seriesData.map((p: any) =>
      new Date(p.timestamp).toISOString().slice(11, 16)
    );
    const temps = seriesData.map((p: any) => p.temp);
    const pressures = seriesData.map((p: any) => p.pressure);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#00f0ff' },
        },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        textStyle: { color: '#f1f5f9', fontFamily: 'JetBrains Mono' },
      },
      legend: {
        data: ['Temperature (°C)', 'Ullage Pressure (mbar)'],
        textStyle: { color: '#94a3b8' },
        top: 8,
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '8%',
        top: '16%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: timestamps,
          axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
          axisLabel: { color: '#94a3b8', fontFamily: 'JetBrains Mono', fontSize: 11 },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Temp (°C)',
          position: 'left',
          min: Math.floor(Math.min(...temps) - 1),
          max: Math.ceil(Math.max(...temps) + 1),
          axisLine: { show: true, lineStyle: { color: '#00f0ff' } },
          axisLabel: { formatter: '{value} °C', color: '#00f0ff' },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
        },
        {
          type: 'value',
          name: 'Pressure (mbar)',
          position: 'right',
          min: Math.floor(Math.min(...pressures) - 1),
          max: Math.ceil(Math.max(...pressures) + 1),
          axisLine: { show: true, lineStyle: { color: '#f59e0b' } },
          axisLabel: { formatter: '{value} mbar', color: '#f59e0b' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Temperature (°C)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: temps,
          itemStyle: { color: '#00f0ff' },
          lineStyle: { width: 3, shadowColor: 'rgba(0, 240, 255, 0.5)', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.25)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' },
            ]),
          },
        },
        {
          name: 'Ullage Pressure (mbar)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          data: pressures,
          itemStyle: { color: '#f59e0b' },
          lineStyle: { width: 2, type: 'dashed' },
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [analyticsData]);

  const ranges = ['1H', '6H', '12H', '24H', '7D', '30D', 'CUSTOM'];

  return (
    <div className="content-container">
      {/* Header & Tank Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
              Telemetry Workspace
            </h1>
            <select
              id="telemetry-tank-picker"
              value={selectedTank}
              onChange={(e) => setSelectedTank(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {Object.keys(tanks).map((id) => (
                <option key={id} value={id}>
                  {tanks[id].name}
                </option>
              ))}
            </select>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            High-frequency temperature and pressure time-series correlation &amp; statistical aggregation.
          </p>
        </div>

        <button
          id="refresh-telemetry-btn"
          className="btn btn-ghost"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Operational Intelligence Cards (Section 8 & 9) */}
      {analyticsData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Temperature Intelligence */}
          <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={18} color="var(--accent-cyan)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                  TEMPERATURE ANALYSIS
                </span>
              </div>
              <span className="badge badge-live">
                <CheckCircle size={11} />
                {analyticsData.temperature.dataAvailabilityPct}% Availability
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CURRENT</div>
                <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  {analyticsData.temperature.current.toFixed(1)} °C
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24H AVERAGE</div>
                <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {analyticsData.temperature.average.toFixed(1)} °C
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24H MAXIMUM</div>
                <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  {analyticsData.temperature.maximum.toFixed(1)} °C
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Minimum: </span>
                <span className="mono" style={{ color: '#fff' }}>{analyticsData.temperature.minimum.toFixed(1)} °C</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>24h Delta: </span>
                <span className="mono" style={{ color: 'var(--accent-emerald)' }}>+{analyticsData.temperature.change} °C</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Trend: </span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{analyticsData.temperature.trend}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Events: </span>
                <span className="mono" style={{ color: '#fff' }}>{analyticsData.temperature.thresholdEvents}</span>
              </div>
            </div>
          </div>

          {/* Pressure Intelligence */}
          <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-amber)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={18} color="var(--accent-amber)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                  PRESSURE ANALYSIS
                </span>
              </div>
              <span className="badge badge-live">
                <CheckCircle size={11} />
                {analyticsData.pressure.dataAvailabilityPct}% Availability
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CURRENT</div>
                <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  {analyticsData.pressure.current.toFixed(1)} mbar
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24H AVERAGE</div>
                <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  {analyticsData.pressure.average.toFixed(1)} mbar
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24H MAXIMUM</div>
                <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  {analyticsData.pressure.maximum.toFixed(1)} mbar
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Minimum: </span>
                <span className="mono" style={{ color: '#fff' }}>{analyticsData.pressure.minimum.toFixed(1)} mbar</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>24h Delta: </span>
                <span className="mono" style={{ color: 'var(--accent-amber)' }}>+{analyticsData.pressure.change} mbar</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Trend: </span>
                <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{analyticsData.pressure.trend}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Events: </span>
                <span className="mono" style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                  {analyticsData.pressure.thresholdEvents}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Time-Series Chart Box */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              COMBINED TIME-SERIES ANALYSIS
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '16px', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', background: '#00f0ff', display: 'inline-block' }} />
                Temperature (°C) Left Axis
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', background: '#f59e0b', borderTop: '1px dashed #f59e0b', display: 'inline-block' }} />
                Ullage Pressure (mbar) Right Axis
              </span>
            </div>
          </div>

          {/* Time Range Selector Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
            {ranges.map((r) => (
              <button
                key={r}
                id={`time-range-btn-${r.toLowerCase()}`}
                style={{
                  background: timeRange === r ? 'var(--accent-cyan)' : 'transparent',
                  color: timeRange === r ? '#070c14' : 'var(--text-secondary)',
                  fontWeight: timeRange === r ? 700 : 500,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
                onClick={() => setTimeRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ECharts DOM Mount Container */}
        <div
          id="telemetry-echarts-container"
          ref={chartRef}
          style={{ width: '100%', height: '380px' }}
        />
      </div>
    </div>
  );
};
