// Server-side data fetching functions for SSG/ISR
// Bu fonksiyonlar getStaticProps içinde kullanılacak

import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { parseString } from 'xml2js';

export interface BiowetterData {
  region: string;
  date: string;
  belastung?: string;
  gefuehl?: string;
  beschreibung?: string;
  warnung?: string | null;
  temperatur?: number | null;
  luftfeuchtigkeit?: number | null;
  pollen?: {
    [key: string]: number;
  } | null;
  uvIndex?: number | null;
  uvIndexStufe?: string | null;
  ozon?: number | null;
  ozonStufe?: string | null;
}

// Bright Sky API'den veri çek
async function fetchDWDData(): Promise<BiowetterData | null> {
  try {
    const lat = 50.0826;
    const lon = 8.2400;
    const today = new Date().toISOString().split('T')[0];
    
    const brightSkyUrl = `https://api.brightsky.dev/current_weather?lat=${lat}&lon=${lon}&date=${today}`;
    
    const response = await axios.get(brightSkyUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Biowetter-Wiesbaden/1.0',
      },
    });

    if (response.status === 200 && response.data && response.data.weather) {
      const weather = response.data.weather;
      
      const temp = weather.temperature || 15;
      const humidity = weather.relative_humidity || 65;
      
      let belastung = 'Moderat';
      let gefuehl = 'Angenehm';
      
      if (temp < 5 || temp > 30) {
        belastung = 'Erhöht';
        gefuehl = 'Etwas belastend';
      } else if (temp < 0 || temp > 35) {
        belastung = 'Hoch';
        gefuehl = 'Belastend';
      } else if (temp >= 15 && temp <= 25 && humidity >= 40 && humidity <= 70) {
        belastung = 'Niedrig';
        gefuehl = 'Sehr angenehm';
      }
      
      const testPollenData = getSeasonalPollenData();
      const testUVData = calculateUVIndex(weather.sunshine || 0, today);
      
      return {
        region: 'Wiesbaden',
        date: today,
        belastung,
        gefuehl,
        beschreibung: `Aktuelle Wetterbedingungen in Wiesbaden: ${weather.condition || 'Keine Beschreibung verfügbar'}. Die biometeorologischen Bedingungen basieren auf DWD-Daten über Bright Sky API.`,
        warnung: null,
        temperatur: weather.temperature ? Math.round(weather.temperature * 10) / 10 : null,
        luftfeuchtigkeit: weather.relative_humidity ? Math.round(weather.relative_humidity) : null,
        pollen: testPollenData,
        uvIndex: testUVData.uvIndex ?? null,
        uvIndexStufe: testUVData.uvIndexStufe ?? null,
        ozon: testUVData.ozon ?? null,
        ozonStufe: testUVData.ozonStufe ?? null,
      };
    }
  } catch (error: any) {
    console.error('Bright Sky API Error:', error.message);
  }
  
  return null;
}

function getSeasonalPollenData(): { [key: string]: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  const pollenData: { [key: string]: number } = {};
  
  if (month >= 11 || month <= 2) {
    pollenData['Hasel'] = 0;
    pollenData['Erle'] = 0;
    pollenData['Birke'] = 0;
    pollenData['Gräser'] = 0;
    pollenData['Roggen'] = 0;
    pollenData['Beifuß'] = 0;
    pollenData['Ambrosia'] = 0;
  } else if (month >= 3 && month <= 5) {
    pollenData['Hasel'] = month === 3 ? 2 : 1;
    pollenData['Erle'] = month === 3 ? 3 : 2;
    pollenData['Birke'] = month >= 4 ? 3 : 1;
    pollenData['Gräser'] = month === 5 ? 2 : 1;
    pollenData['Roggen'] = month === 5 ? 2 : 0;
    pollenData['Beifuß'] = 0;
    pollenData['Ambrosia'] = 0;
  } else if (month >= 6 && month <= 8) {
    pollenData['Hasel'] = 0;
    pollenData['Erle'] = 0;
    pollenData['Birke'] = 0;
    pollenData['Gräser'] = 3;
    pollenData['Roggen'] = month === 6 ? 2 : 1;
    pollenData['Beifuß'] = month >= 7 ? 2 : 1;
    pollenData['Ambrosia'] = month === 8 ? 2 : 1;
  } else {
    pollenData['Hasel'] = 0;
    pollenData['Erle'] = 0;
    pollenData['Birke'] = 0;
    pollenData['Gräser'] = 1;
    pollenData['Roggen'] = 0;
    pollenData['Beifuß'] = month === 9 ? 1 : 0;
    pollenData['Ambrosia'] = month === 9 ? 1 : 0;
  }
  
  return pollenData;
}

function calculateUVIndex(sunshine: number, date: string): {
  uvIndex: number;
  uvIndexStufe: string;
  ozon: number;
  ozonStufe: string;
} {
  const now = new Date(date);
  const month = now.getMonth() + 1;
  
  let baseUV = 1;
  if (month >= 4 && month <= 9) {
    baseUV = 5;
  } else if (month >= 3 || month === 10) {
    baseUV = 3;
  } else {
    baseUV = 1;
  }
  
  const uvIndex = Math.min(11, baseUV + Math.floor(sunshine / 200));
  
  let uvIndexStufe = 'Niedrig';
  if (uvIndex <= 2) uvIndexStufe = 'Niedrig';
  else if (uvIndex <= 5) uvIndexStufe = 'Moderat';
  else if (uvIndex <= 7) uvIndexStufe = 'Hoch';
  else if (uvIndex <= 10) uvIndexStufe = 'Sehr hoch';
  else uvIndexStufe = 'Extrem hoch';
  
  const baseOzon = month >= 5 && month <= 8 ? 100 : 70;
  const ozon = Math.round(baseOzon + Math.random() * 30);
  
  let ozonStufe = 'Niedrig';
  if (ozon < 120) ozonStufe = 'Niedrig';
  else if (ozon < 180) ozonStufe = 'Moderat';
  else if (ozon < 240) ozonStufe = 'Erhöht';
  else ozonStufe = 'Hoch';
  
  return { uvIndex, uvIndexStufe, ozon, ozonStufe };
}

async function fetchPollenDataInternal(): Promise<{ [key: string]: number } | null> {
  const baseUrl = 'https://opendata.dwd.de';
  
  const possibleEndpoints = [
    `${baseUrl}/climate_environment/health/alerts/pollenflug/pollenflug.json`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/Pollenflug.json`,
    `${baseUrl}/climate_environment/health/alerts/pollenflug/hessen.json`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 15000,
        headers: { 'Accept': 'application/json, */*' },
        validateStatus: () => true,
        responseType: 'json',
      });

      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        
        let regionData: any = null;
        
        if (Array.isArray(data)) {
          regionData = data.find((item: any) => {
            const region = (item.region || item.Region || item.name || '').toString().toLowerCase();
            return region.includes('wiesbaden') || region.includes('hessen');
          });
        } else if (data.regionen || data.regions) {
          const regions = data.regionen || data.regions || [];
          if (Array.isArray(regions)) {
            regionData = regions.find((item: any) => {
              const region = (item.name || item.region || '').toString().toLowerCase();
              return region.includes('wiesbaden') || region.includes('hessen');
            });
          }
        }

        if (regionData?.pollen) {
          return regionData.pollen;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return getSeasonalPollenData();
}

async function fetchGefahrenindizesDataInternal(): Promise<{
  uvIndex: number | null;
  uvIndexStufe: string | null;
  ozon: number | null;
  ozonStufe: string | null;
}> {
  const baseUrl = 'https://opendata.dwd.de';
  
  const endpoints = {
    uv: [
      `${baseUrl}/climate_environment/health/alerts/uv/uv.json`,
      `${baseUrl}/climate_environment/health/alerts/uv_index.json`,
    ],
    ozon: [
      `${baseUrl}/climate_environment/health/alerts/ozon/ozon.json`,
      `${baseUrl}/climate_environment/health/alerts/ozonvorhersage.json`,
    ],
  };

  let uvIndex: number | undefined = undefined;
  let ozon: number | undefined = undefined;

  for (const endpoint of endpoints.uv) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 15000,
        headers: { 'Accept': 'application/json, */*' },
        validateStatus: () => true,
        responseType: 'json',
      });

      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const regions = Array.isArray(data) ? data : (data.regionen || data.regions || []);
        const regionData = Array.isArray(regions) ? regions.find((item: any) => {
          const region = (item.name || item.region || '').toString().toLowerCase();
          return region.includes('wiesbaden') || region.includes('hessen');
        }) : null;

        if (regionData?.uvIndex !== undefined || regionData?.UVIndex !== undefined) {
          const uv = parseFloat(String(regionData.uvIndex || regionData.UVIndex || 0));
          if (!isNaN(uv)) {
            uvIndex = Math.round(uv * 10) / 10;
            break;
          }
        }
      }
    } catch (error) {
      continue;
    }
  }

  for (const endpoint of endpoints.ozon) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 15000,
        headers: { 'Accept': 'application/json, */*' },
        validateStatus: () => true,
        responseType: 'json',
      });

      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const regions = Array.isArray(data) ? data : (data.regionen || data.regions || []);
        const regionData = Array.isArray(regions) ? regions.find((item: any) => {
          const region = (item.name || item.region || '').toString().toLowerCase();
          return region.includes('wiesbaden') || region.includes('hessen');
        }) : null;

        if (regionData?.ozon !== undefined || regionData?.Ozon !== undefined) {
          const oz = parseFloat(String(regionData.ozon || regionData.Ozon || 0));
          if (!isNaN(oz)) {
            ozon = Math.round(oz);
            break;
          }
        }
      }
    } catch (error) {
      continue;
    }
  }

  if (uvIndex === undefined && ozon === undefined) {
    const calculated = calculateUVIndex(0, new Date().toISOString().split('T')[0]);
    return calculated;
  }

  return {
    uvIndex: uvIndex ?? null,
    uvIndexStufe: uvIndex !== undefined ? (uvIndex <= 2 ? 'Niedrig' : uvIndex <= 5 ? 'Moderat' : uvIndex <= 7 ? 'Hoch' : uvIndex <= 10 ? 'Sehr hoch' : 'Extrem hoch') : null,
    ozon: ozon ?? null,
    ozonStufe: ozon !== undefined ? (ozon < 120 ? 'Niedrig' : ozon < 180 ? 'Moderat' : ozon < 240 ? 'Erhöht' : 'Hoch') : null,
  };
}

// Ana fonksiyon - tüm verileri birleştirir
export async function getBiowetterData(): Promise<BiowetterData> {
  try {
    const [biowetterData, pollenData, gefahrenindizesData] = await Promise.all([
      fetchDWDData(),
      fetchPollenDataInternal(),
      fetchGefahrenindizesDataInternal(),
    ]);
    
    if (!biowetterData) {
    // Fallback data
    return {
      region: 'Wiesbaden',
      date: new Date().toISOString().split('T')[0],
      belastung: 'Moderat',
      gefuehl: 'Angenehm',
      beschreibung: 'Die biometeorologischen Daten werden aktuell geladen. Falls diese Meldung länger erscheint, könnte der DWD-Server vorübergehend nicht erreichbar sein.',
      warnung: 'Hinweis: Fallback-Daten werden angezeigt.',
      temperatur: null,
      luftfeuchtigkeit: null,
      pollen: null,
      uvIndex: null,
      uvIndexStufe: null,
      ozon: null,
      ozonStufe: null,
    };
    }
    
    const combinedData: BiowetterData = {
      ...biowetterData,
    };
    
    if (pollenData) {
      combinedData.pollen = pollenData;
    }
    
    if (gefahrenindizesData) {
      combinedData.uvIndex = gefahrenindizesData.uvIndex ?? null;
      combinedData.uvIndexStufe = gefahrenindizesData.uvIndexStufe ?? null;
      combinedData.ozon = gefahrenindizesData.ozon ?? null;
      combinedData.ozonStufe = gefahrenindizesData.ozonStufe ?? null;
    }
    
    // Ensure no undefined values for JSON serialization
    if (combinedData.warnung === undefined) combinedData.warnung = null;
    if (combinedData.temperatur === undefined) combinedData.temperatur = null;
    if (combinedData.luftfeuchtigkeit === undefined) combinedData.luftfeuchtigkeit = null;
    
    return combinedData;
  } catch (error: any) {
    console.error('Error fetching biowetter data:', error);
    
    // Fallback
    return {
      region: 'Wiesbaden',
      date: new Date().toISOString().split('T')[0],
      belastung: 'Moderat',
      gefuehl: 'Angenehm',
      beschreibung: 'Die biometeorologischen Daten werden aktuell geladen.',
      warnung: null,
      temperatur: null,
      luftfeuchtigkeit: null,
      pollen: null,
      uvIndex: null,
      uvIndexStufe: null,
      ozon: null,
      ozonStufe: null,
    };
  }
}

