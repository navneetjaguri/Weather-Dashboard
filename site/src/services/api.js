// Call local API endpoints which proxy to external APIs
const cache = new Map();

async function fetchWithCache(url, params) {
  const query = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${query}`;
  
  if (cache.has(fullUrl)) {
    return cache.get(fullUrl);
  }

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    cache.set(fullUrl, data);
    return data;
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
}

export async function getCurrentWeather(lat, lon, date, altitude) {
  const params = {
    lat,
    lon,
  };

  if (altitude != null && !isNaN(altitude)) {
    params.altitude = altitude;
  }

  return fetchWithCache('/api/weather', params);
}

export async function getAirQuality(lat, lon, date) {
  const params = {
    lat,
    lon,
    date
  };
  return fetchWithCache('/api/air-quality', params);
}

export async function getHistoricalWeather(lat, lon, startDate, endDate) {
  const params = {
    lat,
    lon,
    startDate,
    endDate,
    type: 'weather'
  };
  return fetchWithCache('/api/historical', params);
}

export async function getHistoricalAirQuality(lat, lon, startDate, endDate) {
  const params = {
    lat,
    lon,
    startDate,
    endDate,
    type: 'air-quality'
  };
  return fetchWithCache('/api/historical', params);
}
