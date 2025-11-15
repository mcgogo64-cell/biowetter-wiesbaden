import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface GefahrenindizesData {
  region: string;
  date: string;
  uvIndex?: number;
  uvIndexStufe?: string; // Niedrig, Moderat, Hoch, Sehr hoch
  ozon?: number;
  ozonStufe?: string;
}

// DWD Gefahrenindizes verilerini çek (UV-Index ve Ozon)
async function fetchGefahrenindizesData(): Promise<GefahrenindizesData | null> {
  const baseUrl = 'https://opendata.dwd.de';
  
  // DWD Gefahrenindizes endpoint'leri
  const possibleEndpoints = [
    // UV-Index
    `${baseUrl}/climate_environment/health/alerts/uv/uv.json`,
    `${baseUrl}/climate_environment/health/alerts/uv/UV.json`,
    `${baseUrl}/climate_environment/health/alerts/uv_index/uv_index.json`,
    `${baseUrl}/climate_environment/health/alerts/uv_index.json`,
    
    // Ozon
    `${baseUrl}/climate_environment/health/alerts/ozon/ozon.json`,
    `${baseUrl}/climate_environment/health/alerts/ozon/Ozon.json`,
    `${baseUrl}/climate_environment/health/alerts/ozonvorhersage/ozonvorhersage.json`,
    `${baseUrl}/climate_environment/health/alerts/ozonvorhersage.json`,
    
    // Kombine Gefahrenindizes
    `${baseUrl}/climate_environment/health/alerts/gefahrenindizes/gefahrenindizes.json`,
    `${baseUrl}/climate_environment/health/alerts/gefahrenindizes.json`,
  ];

  let uvData: number | undefined = undefined;
  let ozonData: number | undefined = undefined;

  // UV-Index için ayrı ayrı endpoint'leri dene
  for (const endpoint of possibleEndpoints.filter(e => e.includes('uv'))) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 20000,
        headers: {
          'Accept': 'application/json, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; Biowetter-Wiesbaden/1.0)',
        },
        validateStatus: (status) => status < 500,
        responseType: 'json',
      });

      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const uv = parseUVIndex(data, 'Wiesbaden');
        if (uv !== undefined) {
          uvData = uv;
          break;
        }
      }
    } catch (error: any) {
      continue;
    }
  }

  // Ozon için endpoint'leri dene
  for (const endpoint of possibleEndpoints.filter(e => e.includes('ozon'))) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 20000,
        headers: {
          'Accept': 'application/json, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; Biowetter-Wiesbaden/1.0)',
        },
        validateStatus: (status) => status < 500,
        responseType: 'json',
      });

      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const ozon = parseOzon(data, 'Wiesbaden');
        if (ozon !== undefined) {
          ozonData = ozon;
          break;
        }
      }
    } catch (error: any) {
      continue;
    }
  }

  // Kombine endpoint'i dene (eğer varsa)
  if ((uvData === undefined || ozonData === undefined)) {
    for (const endpoint of possibleEndpoints.filter(e => e.includes('gefahrenindizes'))) {
      try {
        const response = await axios.get(endpoint, {
          timeout: 20000,
          headers: {
            'Accept': 'application/json, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; Biowetter-Wiesbaden/1.0)',
          },
          validateStatus: (status) => status < 500,
          responseType: 'json',
        });

        if (response.status === 200 && response.data) {
          const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          
          if (uvData === undefined) {
            const uv = parseUVIndex(data, 'Wiesbaden');
            if (uv !== undefined) uvData = uv;
          }
          
          if (ozonData === undefined) {
            const ozon = parseOzon(data, 'Wiesbaden');
            if (ozon !== undefined) ozonData = ozon;
          }
          
          if (uvData !== undefined && ozonData !== undefined) {
            break;
          }
        }
      } catch (error: any) {
        continue;
      }
    }
  }

  // En az bir veri varsa döndür
  if (uvData !== undefined || ozonData !== undefined) {
    return {
      region: 'Wiesbaden',
      date: new Date().toISOString().split('T')[0],
      uvIndex: uvData,
      uvIndexStufe: uvData !== undefined ? getUVIndexStufe(uvData) : undefined,
      ozon: ozonData,
      ozonStufe: ozonData !== undefined ? getOzonStufe(ozonData) : undefined,
    };
  }

  return null;
}

function parseUVIndex(data: any, city: string): number | undefined {
  try {
    // DWD UV-Index yapısını parse et
    let regionData: any = null;

    if (Array.isArray(data)) {
      regionData = data.find((item: any) => {
        const region = (item.region || item.Region || item.name || item.Name || '').toString().toLowerCase();
        return region.includes('wiesbaden') || region.includes('hessen') || region.includes('frankfurt');
      });
    } else if (data.regionen || data.regions || data.data) {
      const regions = data.regionen || data.regions || data.data || [];
      if (Array.isArray(regions)) {
        regionData = regions.find((item: any) => {
          const region = (item.name || item.Name || item.region || '').toString().toLowerCase();
          return region.includes('wiesbaden') || region.includes('hessen');
        });
      }
    } else if (data.uvIndex !== undefined || data.UVIndex !== undefined) {
      regionData = data;
    }

    if (!regionData) {
      return undefined;
    }

    const uvValue = regionData.uvIndex || regionData.UVIndex || regionData.uv || regionData.UV || regionData.value || regionData.Value;
    if (uvValue !== undefined && uvValue !== null) {
      const numValue = typeof uvValue === 'object' && uvValue._text 
        ? parseFloat(uvValue._text) 
        : parseFloat(String(uvValue));
      
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 15) {
        return Math.round(numValue * 10) / 10; // 1 ondalık basamak
      }
    }

    return undefined;
  } catch (error) {
    console.error('Fehler beim Parsen des UV-Index:', error);
    return undefined;
  }
}

function parseOzon(data: any, city: string): number | undefined {
  try {
    let regionData: any = null;

    if (Array.isArray(data)) {
      regionData = data.find((item: any) => {
        const region = (item.region || item.Region || item.name || '').toString().toLowerCase();
        return region.includes('wiesbaden') || region.includes('hessen');
      });
    } else if (data.regionen || data.regions || data.data) {
      const regions = data.regionen || data.regions || data.data || [];
      if (Array.isArray(regions)) {
        regionData = regions.find((item: any) => {
          const region = (item.name || item.Name || item.region || '').toString().toLowerCase();
          return region.includes('wiesbaden') || region.includes('hessen');
        });
      }
    } else if (data.ozon !== undefined || data.Ozon !== undefined) {
      regionData = data;
    }

    if (!regionData) {
      return undefined;
    }

    const ozonValue = regionData.ozon || regionData.Ozon || regionData.ozonvorhersage || regionData.Ozonvorhersage || regionData.value || regionData.Value;
    if (ozonValue !== undefined && ozonValue !== null) {
      const numValue = typeof ozonValue === 'object' && ozonValue._text 
        ? parseFloat(ozonValue._text) 
        : parseFloat(String(ozonValue));
      
      if (!isNaN(numValue) && numValue >= 0) {
        return Math.round(numValue); // µg/m³ olarak
      }
    }

    return undefined;
  } catch (error) {
    console.error('Fehler beim Parsen des Ozon-Werts:', error);
    return undefined;
  }
}

function getUVIndexStufe(uvIndex: number): string {
  if (uvIndex <= 2) return 'Niedrig';
  if (uvIndex <= 5) return 'Moderat';
  if (uvIndex <= 7) return 'Hoch';
  if (uvIndex <= 10) return 'Sehr hoch';
  return 'Extrem hoch';
}

function getOzonStufe(ozon: number): string {
  // EU standard: < 120 µg/m³: Niedrig, 120-180: Moderat, > 180: Hoch
  if (ozon < 120) return 'Niedrig';
  if (ozon < 180) return 'Moderat';
  if (ozon < 240) return 'Erhöht';
  return 'Hoch';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GefahrenindizesData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await fetchGefahrenindizesData();
    
    if (!data) {
      return res.status(404).json({ error: 'Gefahrenindizes-Daten nicht verfügbar' });
    }
    
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Gefahrenindizes API Error:', error);
    res.status(500).json({ error: error.message || 'Sunucu hatası' });
  }
}

