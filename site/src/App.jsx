import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGeolocation, getLocationName } from './services/location';
import CurrentDashboard from './pages/CurrentDashboard';
import HistoricalDashboard from './pages/HistoricalDashboard';
import { MapPin, Cloud, History, Zap, Pencil, Search, X } from 'lucide-react';
import './App.css';

function App() {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const [locationName, setLocationName] = useState('Detecting…');
  const [manualLocation, setManualLocation] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const routeLocation = useLocation();

  const activeLocation = manualLocation || location;

  useEffect(() => {
    if (activeLocation) {
      getLocationName(activeLocation.lat, activeLocation.lon).then(setLocationName);
    }
  }, [activeLocation]);

  // Search for locations using Nominatim
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8`,
        {
          headers: {
            'User-Agent': 'WeatherLens/1.0'
          }
        }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setManualLocation({ lat, lon, altitude: null });
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

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
          
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px', marginLeft: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f5f5f5',
              borderRadius: '6px',
              padding: '6px 10px',
              border: '1px solid #e0e0e0'
            }}>
              <Search size={14} style={{ color: '#999' }} />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  flex: 1,
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0'
                  }}
                >
                  <X size={14} style={{ color: '#999' }} />
                </button>
              )}
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                marginTop: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLocation(result)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: idx < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {result.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                      {result.display_name?.split(',').slice(0, 2).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchLoading && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                padding: '10px',
                fontSize: '12px',
                color: '#999',
                marginTop: '4px'
              }}>
                Searching...
              </div>
            )}
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
