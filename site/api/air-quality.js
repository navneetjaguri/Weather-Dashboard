export default async function handler(req, res) {
  const { lat, lon, date } = req.query;

  if (!lat || !lon || !date) {
    return res.status(400).json({ error: 'Missing latitude, longitude, or date' });
  }

  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,european_aqi',
      current: 'european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide',
      timezone: 'auto',
      start_date: date,
      end_date: date
    });

    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'max-age=3600, s-maxage=3600');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Air Quality API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch air quality data' });
  }
}
