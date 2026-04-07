export default async function handler(req, res) {
  const { lat, lon, date, altitude } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max',
      hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
      timezone: 'auto',
      forecast_days: 1
    });

    if (altitude && !isNaN(altitude)) {
      params.append('elevation', Math.round(altitude));
    }

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'max-age=3600, s-maxage=3600');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch weather data' });
  }
}
