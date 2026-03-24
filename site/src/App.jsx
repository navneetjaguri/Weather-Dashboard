import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGeolocation, getLocationName } from './services/location';
import CurrentDashboard from './pages/CurrentDashboard';
import HistoricalDashboard from './pages/HistoricalDashboard';
import { MapPin, Cloud, History, Zap } from 'lucide-react';
import './App.css';

function App() {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const [locationName, setLocationName] = useState('Detecting…');
  const routeLocation = useLocation();

  useEffect(() => {
    if (location) {
      getLocationName(location.lat, location.lon).then(setLocationName);
    }
  }, [location]);

  return (
    <div className="app-layout">
      <nav className="nav-bar">
        <div className="nav-left">
          <div className="nav-brand">
            <div className="nav-logo"><Zap size={14} /></div>
            <span className="nav-name">WeatherLens</span>
          </div>
          <div className="nav-location">
            <MapPin size={12} strokeWidth={2.5} />
            <span>{geoLoading ? 'Locating…' : locationName}</span>
          </div>
        </div>

        <div className="nav-tabs">
          <NavLink to="/" className={({ isActive }) => `nav-tab ${isActive && routeLocation.pathname === '/' ? 'active' : ''}`} end>
            <Cloud size={13} /> Current
          </NavLink>
          <NavLink to="/historical" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            <History size={13} /> Historical
          </NavLink>
        </div>
      </nav>

      <main className="main-content">
        {geoError && !geoLoading && (
          <div className="error-bar">⚠ GPS unavailable — showing default location</div>
        )}
        {geoLoading ? (
          <div className="loader-wrap">
            <div className="loader-spin" />
            <p className="loader-text">Detecting your location…</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<CurrentDashboard location={location} />} />
            <Route path="/historical" element={<HistoricalDashboard location={location} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
