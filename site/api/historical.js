export default async function handler(req, res) {
  const { lat, lon, startDate, endDate, type } = req.query;

  if (!lat || !lon || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let url;
    let params;

    if (type === 'weather') {
      params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunrise,sunset,wind_speed_10m_max,wind_direction_10m_dominant',
        timezone: 'Asia/Kolkata',
        start_date: startDate,
        end_date: endDate
      });
      url = 'https://archive-api.open-meteo.com/v1/archive';
    } else {
      params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        hourly: 'pm10,pm2_5',
        timezone: 'Asia/Kolkata',
        start_date: startDate,
        end_date: endDate
      });
      url = 'https://air-quality-api.open-meteo.com/v1/air-quality';
    }

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'max-age=86400, s-maxage=86400');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Historical API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch historical data' });
  }
}
