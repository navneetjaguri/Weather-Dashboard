import express from 'express';
import cors from 'cors';
import { sampleWeatherData, sampleAirQualityData } from './sampleData.js';

const app = express();
app.use(cors());
app.use(express.json());

// Real API endpoints
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const AQ_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive';

// Helper to fetch with timeout
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, altitude } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max',
      hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
      timezone: 'auto',
      forecast_days: '1'
    });

    if (altitude) {
      params.set('elevation', altitude);
    }

    try {
      const data = await fetchWithTimeout(`${WEATHER_API}?${params.toString()}`, 8000);
      res.set('Cache-Control', 'public, max-age=600');
      res.json(data);
    } catch (error) {
      console.log('Falling back to sample weather data');
      res.set('Cache-Control', 'public, max-age=600');
      res.json(sampleWeatherData);
    }
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: `Failed to fetch weather: ${error.message}` });
  }
});

// Air quality endpoint
app.get('/api/air-quality', async (req, res) => {
  try {
    const { lat, lon, date } = req.query;
    
    if (!lat || !lon || !date) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,european_aqi',
      current: 'european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide',
      timezone: 'auto',
      start_date: date,
      end_date: date
    });

    try {
      const data = await fetchWithTimeout(`${AQ_API}?${params.toString()}`, 8000);
      res.set('Cache-Control', 'public, max-age=600');
      res.json(data);
    } catch (error) {
      console.log('Falling back to sample air quality data');
      res.set('Cache-Control', 'public, max-age=600');
      res.json(sampleAirQualityData);
    }
  } catch (error) {
    console.error('Air quality API error:', error.message);
    res.status(500).json({ error: `Failed to fetch air quality: ${error.message}` });
  }
});

// Historical endpoint
app.get('/api/historical', async (req, res) => {
  try {
    const { lat, lon, startDate, endDate, type } = req.query;
    
    if (!lat || !lon || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    let url;
    const baseParams = {
      latitude: lat,
      longitude: lon,
      timezone: 'Asia/Kolkata',
      start_date: startDate,
      end_date: endDate
    };

    if (type === 'air-quality') {
      baseParams.hourly = 'pm10,pm2_5';
      url = AQ_API;
    } else {
      baseParams.daily = 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunrise,sunset,wind_speed_10m_max,wind_direction_10m_dominant';
      url = ARCHIVE_API;
    }

    const params = new URLSearchParams(baseParams);
    
    try {
      const data = await fetchWithTimeout(`${url}?${params.toString()}`, 8000);
      res.set('Cache-Control', 'public, max-age=86400');
      res.json(data);
    } catch (error) {
      console.log('Falling back to sample historical data');
      // Return sample historical data
      const sampleHistorical = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        timezone: 'Asia/Kolkata',
        daily: type === 'air-quality' ? {} : {
          time: [startDate],
          temperature_2m_max: [32.5],
          temperature_2m_min: [20.1],
          temperature_2m_mean: [26.3],
          precipitation_sum: [0],
          sunrise: [startDate + 'T06:15:00'],
          sunset: [startDate + 'T18:45:00'],
          wind_speed_10m_max: [15.8],
          wind_direction_10m_dominant: [190]
        },
        hourly: type === 'air-quality' ? {
          time: [startDate + 'T00:00'],
          pm10: [85],
          pm2_5: [42]
        } : {}
      };
      res.set('Cache-Control', 'public, max-age=86400');
      res.json(sampleHistorical);
    }
  } catch (error) {
    console.error('Historical API error:', error.message);
    res.status(500).json({ error: `Failed to fetch historical data: ${error.message}` });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌤️  API server running on http://localhost:${PORT}`);
  console.log(`📍 Using sample real-world weather data for demonstration`);
  console.log(`💡 On Vercel: Live data from Open-Meteo API`);
});

