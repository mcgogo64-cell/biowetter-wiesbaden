import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface WeatherData {
  region: string;
  date: string;
  temperatur?: number;
  luftfeuchtigkeit?: number;
  wetterZustand?: string;
  windGeschwindigkeit?: number;
}

// Bright Sky API - DWD verilerini JSON formatında sunar
// https://brightsky.dev/ - DWD'nin resmi verilerini kullanan ücretsiz API
async function fetchBrightSkyWeather(): Promise<WeatherData | null> {
  try {
    // Wiesbaden koordinatları
    const lat = 50.0826;
    const lon = 8.2400;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Bright Sky API - DWD'nin resmi verilerini kullanır
    const url = `https://api.brightsky.dev/current_weather?lat=${lat}&lon=${lon}&date=${today}`;
    
    console.log(`Fetching Bright Sky API: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Biowetter-Wiesbaden/1.0',
      },
    });

    if (response.status === 200 && response.data && response.data.weather) {
      const weather = response.data.weather;
      
      return {
        region: 'Wiesbaden',
        date: today,
        temperatur: weather.temperature ? Math.round(weather.temperature * 10) / 10 : undefined,
        luftfeuchtigkeit: weather.relative_humidity ? Math.round(weather.relative_humidity) : undefined,
        wetterZustand: weather.condition || undefined,
        windGeschwindigkeit: weather.wind_speed ? Math.round(weather.wind_speed * 10) / 10 : undefined,
      };
    }

    return null;
  } catch (error: any) {
    console.error('Bright Sky API Error:', error.message);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeatherData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await fetchBrightSkyWeather();
    
    if (!data) {
      return res.status(404).json({ error: 'Wetterdaten nicht verfügbar' });
    }
    
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Weather API Error:', error);
    res.status(500).json({ error: error.message || 'Sunucu hatası' });
  }
}

