import { useState, useMemo } from 'react';
import { format, subMonths, differenceInDays, subDays } from 'date-fns';
import { getHistoricalWeather, getHistoricalAirQuality } from '../services/api';
import Chart from 'react-apexcharts';
import { Calendar, TrendingUp } from 'lucide-react';

export default function HistoricalDashboard({ location }) {
  const today = format(subDays(new Date(), 5), 'yyyy-MM-dd');
  const defStart = format(subMonths(new Date(), 1), 'yyyy-MM-dd');

  const [start, setStart] = useState(defStart);
  const [end, setEnd] = useState(today);
  const [weather, setWeather] = useState(null);
  const [aq, setAq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const validate = () => {
    const s = new Date(start), e = new Date(end);
    if (e <= s) return 'End date must be after start date';
    if (differenceInDays(e, s) > 730) return 'Max range is 2 years';
    return null;
  };

  const fetchData = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(null);
    try {
      const [w, a] = await Promise.all([
        getHistoricalWeather(location.lat, location.lon, start, end),
        getHistoricalAirQuality(location.lat, location.lon, start, end)
      ]);
      setWeather(w); setAq(a); setFetched(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const labels = useMemo(() => weather?.daily?.time?.map(t => format(new Date(t), 'MMM dd')) || [], [weather]);

  const pm = useMemo(() => {
    if (!aq?.hourly?.time || !weather?.daily?.time) return { pm10: [], pm25: [] };
    const m10 = {}, m25 = {};
    aq.hourly.time.forEach((t, i) => {
      const d = t.substring(0, 10);
      if (!m10[d]) { m10[d] = []; m25[d] = []; }
      if (aq.hourly.pm10?.[i] != null) m10[d].push(aq.hourly.pm10[i]);
      if (aq.hourly.pm2_5?.[i] != null) m25[d].push(aq.hourly.pm2_5[i]);
    });
    const avg = arr => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
    return {
      pm10: weather.daily.time.map(d => avg(m10[d] || [])),
      pm25: weather.daily.time.map(d => avg(m25[d] || []))
    };
  }, [aq, weather]);

  const sunData = useMemo(() => {
    if (!weather?.daily) return { up: [], down: [] };
    const h = iso => { if (!iso) return null; const d = new Date(iso); return +(d.getHours() + d.getMinutes() / 60).toFixed(2); };
    return { up: weather.daily.sunrise?.map(h) || [], down: weather.daily.sunset?.map(h) || [] };
  }, [weather]);

  const dirs = useMemo(() => {
    if (!weather?.daily?.wind_direction_10m_dominant) return [];
    const compass = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return weather.daily.wind_direction_10m_dominant.map(d => d == null ? '—' : compass[Math.round(d / 22.5) % 16]);
  }, [weather]);

  const stats = useMemo(() => {
    if (!weather?.daily) return null;
    const d = weather.daily;
    const avg = a => { const v = a?.filter(x => x != null); return v?.length ? (v.reduce((s, x) => s + x, 0) / v.length).toFixed(1) : '—'; };
    const sum = a => { const v = a?.filter(x => x != null); return v?.length ? v.reduce((s, x) => s + x, 0).toFixed(1) : '—'; };
    const max = a => { const v = a?.filter(x => x != null); return v?.length ? Math.max(...v).toFixed(1) : '—'; };
    return { avgT: avg(d.temperature_2m_mean), maxT: max(d.temperature_2m_max), precip: sum(d.precipitation_sum), wind: max(d.wind_speed_10m_max), pm10: avg(pm.pm10), pm25: avg(pm.pm25) };
  }, [weather, pm]);

  const base = (colors, yTitle) => ({
    chart: { toolbar: { show: true, offsetY: -2, tools: { download: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true, selection: true } }, zoom: { enabled: true }, background: 'transparent', fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 400 } },
    colors,
    stroke: { curve: 'smooth', width: 2.5 },
    grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 3, padding: { top: 0, right: 4, bottom: 0, left: 4 }, xaxis: { lines: { show: false } } },
    xaxis: { categories: labels, labels: { style: { colors: '#a8a295', fontSize: '9px' }, rotate: -45, rotateAlways: labels.length > 30 }, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: Math.min(labels.length, 25) },
    yaxis: { title: { text: yTitle, style: { color: '#7f7a6f', fontSize: '10px' } }, labels: { style: { colors: '#a8a295', fontSize: '9px' } } },
    tooltip: { theme: 'light', style: { fontSize: '11px', fontFamily: 'Inter' } },
    legend: { labels: { colors: '#524e46' }, fontSize: '11px', markers: { size: 6, radius: 3 } },
    dataLabels: { enabled: false }, markers: { size: 0, hover: { size: 4 } },
    responsive: [{ breakpoint: 768, options: { chart: { height: 200 }, xaxis: { tickAmount: 10 } } }]
  });

  const fmtHour = v => {
    if (v == null) return '';
    const h = Math.floor(v), m = Math.round((v - h) * 60), p = h >= 12 ? 'PM' : 'AM';
    return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m.toString().padStart(2, '0')} ${p}`;
  };

  return (
    <div style={{ animation: 'enter 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historical Trends</h1>
          <p className="page-subtitle">Analyze weather patterns — up to 2 years</p>
        </div>
        <div className="range-picker">
          <div className="range-group"><label>Start</label><input type="date" value={start} max={end} onChange={e => setStart(e.target.value)} /></div>
          <div className="range-group"><label>End</label><input type="date" value={end} max={today} onChange={e => setEnd(e.target.value)} /></div>
          <button className="btn-primary" onClick={fetchData} disabled={loading}>{loading ? 'Loading…' : 'Fetch Data'}</button>
        </div>
      </div>

      {error && <div className="error-bar">⚠ {error}</div>}
      {loading && <div className="loader-wrap"><div className="loader-spin" /><p className="loader-text">Fetching historical data…</p></div>}

      {!loading && !fetched && (
        <div className="empty-prompt">
          <div className="empty-icon"><Calendar size={24} /></div>
          <p>Pick a date range and click <strong>Fetch Data</strong> to start analyzing</p>
        </div>
      )}

      {fetched && weather && !loading && (
        <>
          {stats && (
            <>
              <div className="section-label">Period summary</div>
              <div className="summary-grid">
                <SummaryCard label="Avg Temperature" value={`${stats.avgT}°C`} />
                <SummaryCard label="Max Temperature" value={`${stats.maxT}°C`} />
                <SummaryCard label="Total Precipitation" value={`${stats.precip} mm`} />
                <SummaryCard label="Max Wind Speed" value={`${stats.wind} km/h`} />
                <SummaryCard label="Avg PM10" value={`${stats.pm10} µg/m³`} />
                <SummaryCard label="Avg PM2.5" value={`${stats.pm25} µg/m³`} />
              </div>
            </>
          )}

          <div className="charts-header">
            <span className="charts-title">Historical Charts</span>
            <span className="charts-label">{labels.length} days</span>
          </div>

          <div className="charts-grid">
            <div className="card chart-card">
              <div className="chart-head"><h3>Temperature Trends</h3><p>Mean · Max · Min</p></div>
              <Chart options={{ ...base(['#a0634b', '#b85c65', '#5d8a6e'], '°C'), fill: { type: 'gradient', gradient: { opacityFrom: 0.15, opacityTo: 0.02, stops: [0, 100] } } }}
                series={[{ name: 'Mean', data: weather.daily.temperature_2m_mean || [] }, { name: 'Max', data: weather.daily.temperature_2m_max || [] }, { name: 'Min', data: weather.daily.temperature_2m_min || [] }]}
                type="area" height={280} />
            </div>

            <div className="card chart-card">
              <div className="chart-head"><h3>Sun Cycle</h3><p>Sunrise & Sunset · IST</p></div>
              <Chart options={{ ...base(['#c49a3c', '#8b7bb5'], 'Hour (IST)'), chart: { ...base([], '').chart, type: 'line' }, stroke: { curve: 'smooth', width: 2.5 },
                yaxis: { title: { text: 'Hour (IST)', style: { color: '#7f7a6f', fontSize: '10px' } }, labels: { style: { colors: '#a8a295', fontSize: '9px' }, formatter: fmtHour } },
                tooltip: { theme: 'light', y: { formatter: fmtHour } } }}
                series={[{ name: 'Sunrise', data: sunData.up }, { name: 'Sunset', data: sunData.down }]}
                type="line" height={280} />
            </div>

            <div className="card chart-card">
              <div className="chart-head"><h3>Precipitation</h3><p>Daily total</p></div>
              <Chart options={{ ...base(['#5d8a6e'], 'mm'), chart: { ...base([], '').chart, type: 'bar' }, plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, gradientToColors: ['#2d5a3e'], stops: [0, 100] } } }}
                series={[{ name: 'Precip', data: weather.daily.precipitation_sum || [] }]}
                type="bar" height={280} />
            </div>

            <div className="card chart-card">
              <div className="chart-head"><h3>Wind</h3><p>Max speed & direction</p></div>
              <Chart options={{ ...base(['#6889a8'], 'km/h'), fill: { type: 'gradient', gradient: { opacityFrom: 0.18, opacityTo: 0.02, stops: [0, 100] } },
                tooltip: { theme: 'light', custom: ({ series, seriesIndex, dataPointIndex }) => {
                  const spd = series[seriesIndex][dataPointIndex], lb = labels[dataPointIndex] || '', dr = dirs[dataPointIndex] || '';
                  return `<div style="padding:7px 14px;background:#fff;border-radius:8px;font-size:11px;color:#1e1c19;border:1px solid rgba(0,0,0,0.08);box-shadow:0 2px 8px rgba(0,0,0,0.06)"><div style="color:#a8a295;font-size:10px;margin-bottom:2px">${lb}</div><strong>${spd} km/h</strong> <span style="color:#6889a8">${dr}</span></div>`;
                } } }}
                series={[{ name: 'Max Wind', data: weather.daily.wind_speed_10m_max || [] }]}
                type="area" height={280} />
            </div>

            <div className="card chart-card" style={{ gridColumn: '1 / -1' }}>
              <div className="chart-head"><h3>Air Quality — PM10 & PM2.5</h3><p>Daily average</p></div>
              <Chart options={{ ...base(['#8b7bb5', '#5d8a6e'], 'µg/m³'), fill: { type: 'gradient', gradient: { opacityFrom: 0.15, opacityTo: 0.02, stops: [0, 100] } } }}
                series={[{ name: 'PM10', data: pm.pm10 }, { name: 'PM2.5', data: pm.pm25 }]}
                type="area" height={280} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="card summary-card">
      <div className="s-label">{label}</div>
      <div className="s-val">{value}</div>
    </div>
  );
}
