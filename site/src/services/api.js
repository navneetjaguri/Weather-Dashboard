import axios from 'axios';

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const AQ_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function getCurrentWeather(lat, lon, date, altitude) {
  const params = {
    latitude: lat,
    longitude: lon,
    daily: [
      'temperature_2m_max', 'temperature_2m_min',
      'precipitation_sum', 'precipitation_probability_max',
      'uv_index_max', 'sunrise', 'sunset',
      'wind_speed_10m_max'
    ].join(','),
    hourly: [
      'temperature_2m', 'relative_humidity_2m',
      'wind_speed_10m', 'precipitation'
    ].join(','),
    current: [
      'temperature_2m', 'relative_humidity_2m',
      'precipitation', 'wind_speed_10m', 'weather_code'
    ].join(','),
    timezone: 'auto',
    start_date: date,
    end_date: date
  };

  // If GPS altitude is available, pass it to Open-Meteo for
  // elevation-corrected temperature (important in hilly areas)
  if (altitude != null && !isNaN(altitude)) {
    params.elevation = Math.round(altitude);
  }

  const { data } = await axios.get(WEATHER_BASE, { params });
  return data;
}

export async function getAirQuality(lat, lon, date) {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: [
      'pm10', 'pm2_5',
      'carbon_monoxide', 'nitrogen_dioxide',
      'sulphur_dioxide', 'european_aqi'
    ].join(','),
    current: [
      'european_aqi', 'pm10', 'pm2_5',
      'carbon_monoxide', 'nitrogen_dioxide',
      'sulphur_dioxide'
    ].join(','),
    timezone: 'auto',
    start_date: date,
    end_date: date
  };
  const { data } = await axios.get(AQ_BASE, { params });
  return data;
}

export async function getHistoricalWeather(lat, lon, startDate, endDate) {
  const params = {
    latitude: lat,
    longitude: lon,
    daily: [
      'temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean',
      'precipitation_sum',
      'sunrise', 'sunset',
      'wind_speed_10m_max', 'wind_direction_10m_dominant'
    ].join(','),
    timezone: 'Asia/Kolkata',
    start_date: startDate,
    end_date: endDate
  };
  const { data } = await axios.get(ARCHIVE_BASE, { params });
  return data;
}

export async function getHistoricalAirQuality(lat, lon, startDate, endDate) {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: ['pm10', 'pm2_5'].join(','),
    timezone: 'Asia/Kolkata',
    start_date: startDate,
    end_date: endDate
  };
  const { data } = await axios.get(AQ_BASE, { params });
  return data;
}
