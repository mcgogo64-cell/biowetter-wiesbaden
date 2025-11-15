import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface PollenData {
  region: string;
  date: string;
  pollen?: {
    [key: string]: number; // Polen türü -> Yoğunluk (0-3)
  };
}

// DWD Pollenflug-Gefahrenindex verilerini çek
async function fetchPollenData(): Promise<PollenData | null> {
  const baseUrl = 'https://opendata.dwd.de';
  
  // DWD Pollenflug endpoint'leri
  const possibleEndpoints = [
    // Pollenflug-Gefahrenindex JSON
    `${baseUrl}/climate_environment/health/alerts/pollenflug/pollenflug.json`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/Pollenflug.json`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/pollen.json`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/Pollen.json`,
    
    // Hessen için spesifik
    `${baseUrl}/climate_environment/health/alerts/pollenflug/hessen.json`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/Hessen.json`,
    
    // Alternatif formatlar
    `${baseUrl}/climate_environment/health/alerts/pollenflug/pollenflug.xml`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/pollenflug.csv`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Versuche Pollen-Endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        timeout: 20000,
        headers: {
          'Accept': 'application/json, application/xml, text/csv, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; Biowetter-Wiesbaden/1.0)',
        },
        validateStatus: (status) => status < 500,
        responseType: endpoint.endsWith('.json') ? 'json' : 'text',
      });

      if (response.status === 200 && response.data) {
        console.log(`Erfolgreich Pollen-Daten von: ${endpoint}`);
        
        // JSON formatını parse et
        if (endpoint.endsWith('.json') || typeof response.data === 'object') {
          const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          const parsedData = parsePollenData(data, 'Wiesbaden');
          
          if (parsedData) {
            return parsedData;
          }
        }
      }
    } catch (error: any) {
      console.log(`Pollen-Endpoint fehlgeschlagen: ${endpoint} - ${error.message}`);
      continue;
    }
  }

  console.warn('Alle Pollen-Endpoints fehlgeschlagen.');
  return null;
}

function parsePollenData(data: any, city: string): PollenData | null {
  try {
    // DWD Pollenflug JSON yapısı
    // Genellikle: { regionen: [{ name: "Hessen", pollen: {...} }] } veya array formatında
    
    const pollenTypes = [
      'Hasel', 'Erle', 'Esche', 'Birke', 'Süßgräser', 'Roggen', 'Beifuß', 'Ambrosia',
      'hasel', 'erle', 'esche', 'birke', 'süßgräser', 'roggen', 'beifuß', 'ambrosia',
      'hazel', 'alder', 'ash', 'birch', 'grass', 'rye', 'mugwort', 'ragweed'
    ];

    let regionData: any = null;

    // Format 1: Array format
    if (Array.isArray(data)) {
      regionData = data.find((item: any) => {
        const region = (item.region || item.Region || item.name || item.Name || '').toString().toLowerCase();
        return region.includes('wiesbaden') || region.includes('hessen') || region.includes('frankfurt');
      });
    }
    // Format 2: Obje içinde regionen/regions
    else if (data.regionen || data.regions || data.data) {
      const regions = data.regionen || data.regions || data.data || [];
      if (Array.isArray(regions)) {
        regionData = regions.find((item: any) => {
          const region = (item.name || item.Name || item.region || item.Region || '').toString().toLowerCase();
          return region.includes('wiesbaden') || region.includes('hessen') || region.includes('frankfurt');
        });
      }
    }
    // Format 3: Direkt obje
    else if (data.name || data.region || data.pollen) {
      const region = (data.name || data.region || '').toString().toLowerCase();
      if (region.includes('wiesbaden') || region.includes('hessen') || region.includes('frankfurt')) {
        regionData = data;
      }
    }

    if (!regionData) {
      return null;
    }

    // Polen verilerini çıkar
    const pollenObj: { [key: string]: number } = {};
    const pollenData = regionData.pollen || regionData.Pollen || regionData;

    for (const type of pollenTypes) {
      const value = pollenData[type] || pollenData[type.toLowerCase()] || pollenData[type.toUpperCase()];
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'object' && value._text 
          ? parseFloat(value._text) 
          : parseFloat(String(value));
        
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 3) {
          // Polen türü adını normalize et
          const normalizedName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
          pollenObj[normalizedName] = Math.round(numValue);
        }
      }
    }

    // Eğer hiç polen verisi bulunamadıysa null döndür
    if (Object.keys(pollenObj).length === 0) {
      return null;
    }

    return {
      region: city,
      date: regionData.date || regionData.Date || new Date().toISOString().split('T')[0],
      pollen: pollenObj,
    };
  } catch (error) {
    console.error('Fehler beim Parsen der Pollen-Daten:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PollenData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await fetchPollenData();
    
    if (!data) {
      return res.status(404).json({ error: 'Pollen-Daten nicht verfügbar' });
    }
    
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Pollen API Error:', error);
    res.status(500).json({ error: error.message || 'Sunucu hatası' });
  }
}

