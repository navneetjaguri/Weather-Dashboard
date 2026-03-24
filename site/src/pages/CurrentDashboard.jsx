import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { getCurrentWeather, getAirQuality } from '../services/api';
import {
  Droplets, Wind, CloudRain, Sun, ArrowUp, ArrowDown,
  Sunrise, Sunset, Gauge, Eye
} from 'lucide-react';
import Chart from 'react-apexcharts';

const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Moderate showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
};

export default function CurrentDashboard({ location }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [weather, setWeather] = useState(null);
  const [aq, setAq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState('C');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getCurrentWeather(location.lat, location.lon, date),
      getAirQuality(location.lat, location.lon, date)
    ]).then(([w, a]) => { setWeather(w); setAq(a); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [location, date]);

  const toF = c => (c * 9 / 5 + 32).toFixed(1);
  const t = c => c == null ? '—' : unit === 'C' ? `${c.toFixed(1)}°` : `${toF(c)}°`;

  const hours = useMemo(() => weather?.hourly?.time?.map(x => format(new Date(x), 'HH:mm')) || [], [weather]);

  const tempData = useMemo(() => {
    if (!weather?.hourly?.temperature_2m) return [];
    return [{ name: `Temp (°${unit})`, data: weather.hourly.temperature_2m.map(v => v != null ? +(unit === 'C' ? v.toFixed(1) : toF(v)) : null) }];
  }, [weather, unit]);

  const humData = useMemo(() => weather?.hourly?.relative_humidity_2m ? [{ name: 'Humidity (%)', data: weather.hourly.relative_humidity_2m }] : [], [weather]);
  const windData = useMemo(() => weather?.hourly?.wind_speed_10m ? [{ name: 'Wind (km/h)', data: weather.hourly.wind_speed_10m }] : [], [weather]);
  const pmData = useMemo(() => {
    if (!aq?.hourly) return [];
    return [{ name: 'PM10', data: aq.hourly.pm10 || [] }, { name: 'PM2.5', data: aq.hourly.pm2_5 || [] }];
  }, [aq]);

  const chartOpts = (colors, yLabel) => ({
    chart: { type: 'area', toolbar: { show: true, offsetY: -2, tools: { download: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true, selection: true } }, zoom: { enabled: true }, background: 'transparent', fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 400 } },
    colors,
    fill: { type: 'gradient', gradient: { opacityFrom: 0.18, opacityTo: 0.02, stops: [0, 100] } },
    stroke: { curve: 'smooth', width: 2.5 },
    grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 3, padding: { top: 0, right: 4, bottom: 0, left: 4 }, xaxis: { lines: { show: false } } },
    xaxis: { categories: hours, labels: { style: { colors: '#a8a295', fontSize: '9px' }, rotate: -45, rotateAlways: hours.length > 14 }, axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
    yaxis: { title: { text: yLabel, style: { color: '#7f7a6f', fontSize: '10px' } }, labels: { style: { colors: '#a8a295', fontSize: '9px' }, formatter: v => v != null ? v.toFixed(1) : '' } },
    tooltip: { theme: 'light', style: { fontSize: '11px', fontFamily: 'Inter' } },
    legend: { labels: { colors: '#524e46' }, fontSize: '11px', markers: { size: 6, radius: 3 } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 4 } },
    responsive: [{ breakpoint: 768, options: { chart: { height: 200 } } }]
  });

  if (loading) return <div className="loader-wrap"><div className="loader-spin" /><p className="loader-text">Loading weather…</p></div>;
  if (error) return <div className="error-bar">⚠ {error}</div>;

  const d = weather?.daily;
  const c = weather?.current;
  const a = aq?.current;
  const fmt = iso => iso ? format(new Date(iso), 'h:mm a') : '—';
  const cond = WMO[c?.weather_code] || 'Current conditions';

  const sunPct = (() => {
    if (!d?.sunrise?.[0] || !d?.sunset?.[0]) return 50;
    const now = Date.now(), rise = +new Date(d.sunrise[0]), set = +new Date(d.sunset[0]);
    if (now < rise) return 0;
    if (now > set) return 100;
    return Math.round(((now - rise) / (set - rise)) * 100);
  })();

  return (
    <div style={{ animation: 'enter 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Current Weather</h1>
          <p className="page-subtitle">Real-time data and hourly forecast</p>
        </div>
        <div className="controls">
          <div className="toggle">
            <button className={`toggle-btn ${unit === 'C' ? 'active' : ''}`} onClick={() => setUnit('C')}>°C</button>
            <button className={`toggle-btn ${unit === 'F' ? 'active' : ''}`} onClick={() => setUnit('F')}>°F</button>
          </div>
          <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* Hero */}
      <div className="hero">
        <div className="card hero-main">
          <div>
            <div className="weather-now">
              <Cloud size={14} />
              <span>{cond}</span>
            </div>
            <div className="temp-row">
              <span className="temp-big">{c?.temperature_2m != null ? (unit === 'C' ? `${c.temperature_2m.toFixed(0)}°` : `${toF(c.temperature_2m)}°`) : '—'}</span>
              <div className="temp-hilo">
                <span className="hi"><ArrowUp size={11} />{t(d?.temperature_2m_max?.[0])}</span>
                <span className="lo"><ArrowDown size={11} />{t(d?.temperature_2m_min?.[0])}</span>
              </div>
            </div>
          </div>
          <div className="quick-stats">
            <div className="quick-stat"><Wind size={13} />{c?.wind_speed_10m?.toFixed(0) ?? '—'} km/h</div>
            <div className="quick-stat"><Droplets size={13} />{c?.relative_humidity_2m ?? '—'}%</div>
            <div className="quick-stat"><CloudRain size={13} />{c?.precipitation?.toFixed(1) ?? '0'} mm</div>
          </div>
        </div>

        <div className="card sun-panel">
          <div className="sun-panel-title">Sun & Conditions</div>
          <div className="sun-row">
            <div className="sun-item"><label>Sunrise</label><div className="time">{fmt(d?.sunrise?.[0])}</div></div>
            <div className="sun-item"><label>Sunset</label><div className="time">{fmt(d?.sunset?.[0])}</div></div>
          </div>
          <div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${sunPct}%` }} /></div>
            <div className="progress-meta"><span>Dawn</span><span>{sunPct}% daylight</span><span>Dusk</span></div>
          </div>
          <div className="sun-secondary">
            <div className="sun-stat">
              <label>UV Index</label>
              <div className="val">
                {d?.uv_index_max?.[0]?.toFixed(1) ?? '—'}
                <span className={`pill ${uvPill(d?.uv_index_max?.[0])}`}>{uvText(d?.uv_index_max?.[0])}</span>
              </div>
            </div>
            <div className="sun-stat">
              <label>Rain chance</label>
              <div className="val">{d?.precipitation_probability_max?.[0] ?? '—'}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Atmospheric */}
      <div className="section-label">Atmosphere & Wind</div>
      <div className="metrics-grid">
        <Metric name="Precipitation" val={d?.precipitation_sum?.[0]?.toFixed(1) ?? '—'} u="mm" dot="c1" />
        <Metric name="Humidity" val={c?.relative_humidity_2m ?? '—'} u="%" dot="c1" />
        <Metric name="Max Wind" val={d?.wind_speed_10m_max?.[0]?.toFixed(1) ?? '—'} u="km/h" dot="c2" />
        <Metric name="Rain Probability" val={d?.precipitation_probability_max?.[0] ?? '—'} u="%" dot="c2" />
      </div>

      {/* Air Quality */}
      <div className="section-label">Air Quality</div>
      <div className="metrics-grid">
        <div className="card metric">
          <div className="metric-top"><span className="metric-name">AQI</span><span className={`pill ${aqiPill(a?.european_aqi)}`}>{aqiText(a?.european_aqi)}</span></div>
          <span className="metric-val">{a?.european_aqi ?? '—'}</span>
        </div>
        <Metric name="PM10" val={a?.pm10?.toFixed(1) ?? '—'} u="µg/m³" dot="c3" />
        <Metric name="PM2.5" val={a?.pm2_5?.toFixed(1) ?? '—'} u="µg/m³" dot="c3" />
        <Metric name="NO₂" val={a?.nitrogen_dioxide?.toFixed(1) ?? '—'} u="µg/m³" dot="c3" />
        <Metric name="SO₂" val={a?.sulphur_dioxide?.toFixed(1) ?? '—'} u="µg/m³" dot="c4" />
        <Metric name="CO" val={a?.carbon_monoxide?.toFixed(1) ?? '—'} u="µg/m³" dot="c4" />
      </div>

      {/* Charts */}
      <div className="charts-header">
        <span className="charts-title">Hourly Forecast</span>
        <span className="charts-label">24 hours</span>
      </div>
      <div className="charts-grid">
        <HChart title="Temperature" sub={`Hourly · °${unit}`} s={tempData} o={chartOpts(['#a0634b'], `°${unit}`)} />
        <HChart title="Relative Humidity" sub="Moisture level" s={humData} o={chartOpts(['#5d8a6e'], '%')} />
        <HChart title="Wind Speed (10m)" sub="Wind conditions" s={windData} o={chartOpts(['#6889a8'], 'km/h')} />
        <HChart title="PM10 & PM2.5" sub="Particulate matter" s={pmData} o={chartOpts(['#8b7bb5', '#5d8a6e'], 'µg/m³')} />
      </div>
    </div>
  );
}

function Metric({ name, val, u, dot }) {
  return (
    <div className="card metric">
      <div className="metric-top"><span className="metric-name">{name}</span><span className={`metric-dot ${dot}`} /></div>
      <span className="metric-val">{val} <span className="metric-unit">{u}</span></span>
    </div>
  );
}

function HChart({ title, sub, s, o }) {
  return (
    <div className="card chart-card">
      <div className="chart-head"><h3>{title}</h3><p>{sub}</p></div>
      {s.length > 0 && <Chart options={o} series={s} type="area" height={240} />}
    </div>
  );
}

function Cloud({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
}

function uvText(v) { if (v == null) return ''; if (v <= 2) return 'Low'; if (v <= 5) return 'Moderate'; if (v <= 7) return 'High'; if (v <= 10) return 'Very high'; return 'Extreme'; }
function uvPill(v) { if (v == null) return ''; if (v <= 2) return 'pill-green'; if (v <= 5) return 'pill-yellow'; return 'pill-red'; }
function aqiText(v) { if (v == null) return ''; if (v <= 20) return 'Good'; if (v <= 40) return 'Fair'; if (v <= 60) return 'Moderate'; if (v <= 80) return 'Poor'; return 'Very poor'; }
function aqiPill(v) { if (v == null) return ''; if (v <= 40) return 'pill-green'; if (v <= 60) return 'pill-yellow'; return 'pill-red'; }
