import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocation({ lat: 28.6139, lon: 77.2090 });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          // Capture altitude from GPS if available (in meters)
          altitude: position.coords.altitude
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        // Fallback to New Delhi
        setLocation({ lat: 28.6139, lon: 77.2090 });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0  // Always get fresh position, no caching
      }
    );
  }, []);

  return { location, error, loading };
}

export async function getLocationName(lat, lon) {
  try {
    const nominatim = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
    );
    const data = await nominatim.json();
    if (data?.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const state = data.address.state || '';
      return city ? `${city}, ${state}` : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  } catch {
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }
}
