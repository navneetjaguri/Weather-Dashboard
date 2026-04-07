import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGeolocation, getLocationName } from './services/location';
import CurrentDashboard from './pages/CurrentDashboard';
import HistoricalDashboard from './pages/HistoricalDashboard';
import { MapPin, Cloud, History, Zap, Pencil } from 'lucide-react';
import './App.css';

function App() {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const [locationName, setLocationName] = useState('Detecting…');
  const [manualLocation, setManualLocation] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const routeLocation = useLocation();

  const activeLocation = manualLocation || location;

  useEffect(() => {
    if (activeLocation) {
      getLocationName(activeLocation.lat, activeLocation.lon).then(setLocationName);
    }
  }, [activeLocation]);

  const handleSetLocation = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setManualLocation({ lat, lon, altitude: null });
      setShowLocationInput(false);
      setLatInput('');
      setLonInput('');
    } else {
      alert('Please enter valid coordinates:\nLatitude: -90 to 90\nLongitude: -180 to 180');
    }
  };

  return (
    <div className="app-layout">
      <nav className="nav-bar">
        <div className="nav-left">
          <div className="nav-brand">
            <div className="nav-logo"><Zap size={14} /></div>
            <span className="nav-name">WeatherLens</span>
          </div>
          <div className="nav-location" onClick={() => setShowLocationInput(!showLocationInput)} style={{ cursor: 'pointer' }}>
            <MapPin size={12} strokeWidth={2.5} />
            <span>{geoLoading ? 'Locating…' : locationName}</span>
            <Pencil size={11} style={{ marginLeft: '6px', opacity: 0.6 }} />
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

      {showLocationInput && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255, 200, 90, 0.1)',
          borderBottom: '1px solid rgba(255, 200, 90, 0.3)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <input
            type="number"
            placeholder="Latitude (-90 to 90)"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            step="0.0001"
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '12px',
              width: '140px'
            }}
          />
          <input
            type="number"
            placeholder="Longitude (-180 to 180)"
            value={lonInput}
            onChange={(e) => setLonInput(e.target.value)}
            step="0.0001"
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '12px',
              width: '160px'
            }}
          />
          <button
            onClick={handleSetLocation}
            style={{
              padding: '6px 12px',
              background: '#ff8a00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Set
          </button>
          <button
            onClick={() => {
              setShowLocationInput(false);
              setLatInput('');
              setLonInput('');
            }}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#666',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <main className="main-content">
        {geoError && !manualLocation && !geoLoading && (
          <div className="error-bar">⚠ GPS unavailable — showing default location (click location to enter manual coordinates)</div>
        )}
        {geoLoading && !manualLocation ? (
          <div className="loader-wrap">
            <div className="loader-spin" />
            <p className="loader-text">Detecting your location…</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<CurrentDashboard location={activeLocation} />} />
            <Route path="/historical" element={<HistoricalDashboard location={activeLocation} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
