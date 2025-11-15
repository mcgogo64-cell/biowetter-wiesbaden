import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { parseString } from 'xml2js';

interface BiowetterData {
  region: string;
  date: string;
  belastung?: string;
  gefuehl?: string;
  beschreibung?: string;
  warnung?: string;
  temperatur?: number;
  luftfeuchtigkeit?: number;
  pollen?: {
    [key: string]: number; // Polen türü -> Yoğunluk (0-3)
  };
  uvIndex?: number;
  uvIndexStufe?: string;
  ozon?: number;
  ozonStufe?: string;
}

// DWD Open Data'dan Wiesbaden için biyometeorolojik veri çekme
// DWD API key gerektirmez - önceden oluşturulmuş dosyalara doğrudan HTTP ile erişim
async function fetchDWDData(): Promise<BiowetterData | null> {
  // Bright Sky API kullanarak gerçek DWD verilerine erişim
  // Bright Sky, DWD'nin resmi verilerini JSON formatında sunar
  try {
    const lat = 50.0826; // Wiesbaden latitude
    const lon = 8.2400; // Wiesbaden longitude
    const today = new Date().toISOString().split('T')[0];
    
    const brightSkyUrl = `https://api.brightsky.dev/current_weather?lat=${lat}&lon=${lon}&date=${today}`;
    
    console.log(`Versuche Bright Sky API (DWD Daten): ${brightSkyUrl}`);
    
    const response = await axios.get(brightSkyUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Biowetter-Wiesbaden/1.0',
      },
    });

    if (response.status === 200 && response.data && response.data.weather) {
      const weather = response.data.weather;
      const sources = response.data.sources || [];
      
      console.log('Bright Sky API erfolgreich - DWD Daten erhalten');
      
      // Biowetter seviyesini sıcaklık ve diğer faktörlere göre hesapla
      const temp = weather.temperature || 15;
      const humidity = weather.relative_humidity || 65;
      
      // Basit biometeorolojik belastung hesaplama
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
      
      return {
        region: 'Wiesbaden',
        date: today,
        belastung,
        gefuehl,
        beschreibung: `Aktuelle Wetterbedingungen in Wiesbaden: ${weather.condition || 'Keine Beschreibung verfügbar'}. Die biometeorologischen Bedingungen basieren auf DWD-Daten über Bright Sky API.`,
        warnung: undefined,
        temperatur: weather.temperature ? Math.round(weather.temperature * 10) / 10 : undefined,
        luftfeuchtigkeit: weather.relative_humidity ? Math.round(weather.relative_humidity) : undefined,
      };
    }
  } catch (error: any) {
    console.error('Bright Sky API Error:', error.message);
  }
  
  // Fallback: Direkt DWD endpoint'lerini dene
  const baseUrl = 'https://opendata.dwd.de';
  
  const possibleEndpoints = [
    // Biyometeorolojik uyarılar - XML formatları
    `${baseUrl}/climate_environment/health/alerts/warnings/BGWW_L.xml`,
    `${baseUrl}/climate_environment/health/alerts/warnings/bgww_l.xml`,
    `${baseUrl}/climate_environment/health/alerts/warnings/BGWW.xml`,
    `${baseUrl}/climate_environment/health/alerts/warnings/bgww.xml`,
    
    // Alternatif XML endpoint'leri
    `${baseUrl}/climate_environment/health/alerts/biometeorology/biometeorology.xml`,
    `${baseUrl}/climate_environment/health/alerts/biometeorology/Biometeorology.xml`,
    
    // CSV formatları
    `${baseUrl}/climate_environment/health/alerts/warnings/biometeorology.csv`,
    `${baseUrl}/climate_environment/health/alerts/warnings/Biometeorology.csv`,
    
    // JSON formatları (eğer varsa)
    `${baseUrl}/climate_environment/health/alerts/warnings/bgww.json`,
    `${baseUrl}/climate_environment/health/alerts/warnings/BGWW.json`,
    `${baseUrl}/climate_environment/health/alerts/biometeorology/biometeorology.json`,
    
    // Hessen bölgesi için spesifik veriler
    `${baseUrl}/climate_environment/health/alerts/warnings/hessen.xml`,
    `${baseUrl}/climate_environment/health/alerts/warnings/Hessen.xml`,
  ];

  // Her bir endpoint'i sırayla dene
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Versuche DWD-Endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        timeout: 20000,
        headers: {
          'Accept': 'application/xml, text/csv, application/json, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; Biowetter-Wiesbaden/1.0)',
        },
        validateStatus: (status) => status < 500, // 4xx hataları için bile devam et
        responseType: 'text', // XML ve CSV için text olarak al
      });

      // Başarılı istek kontrolü
      if (response.status === 200 && response.data) {
        console.log(`Erfolgreich Daten von: ${endpoint} (${response.headers['content-type']})`);
        
        // Format'a göre parse et
        let parsedData: BiowetterData | null = null;
        
        const contentType = response.headers['content-type'] || '';
        
        if (endpoint.endsWith('.xml') || contentType.includes('xml')) {
          parsedData = await parseDWDXML(response.data, 'Wiesbaden');
        } else if (endpoint.endsWith('.csv') || contentType.includes('csv')) {
          parsedData = parseDWDCSV(response.data, 'Wiesbaden');
        } else {
          // JSON veya diğer formatlar
          try {
            const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            parsedData = parseDWDData(jsonData, 'Wiesbaden', endpoint);
          } catch (e) {
            // JSON parse hatası, text olarak devam et
            console.log('JSON parse hatası, text olarak parse ediliyor...');
          }
        }
        
        if (parsedData) {
          return parsedData;
        }
      }
    } catch (error: any) {
      // Bu endpoint başarısız oldu, bir sonrakini dene
      console.log(`Endpoint fehlgeschlagen: ${endpoint} - ${error.message}`);
      continue;
    }
  }

  // Tüm endpoint'ler başarısız olduysa fallback veri döndür
  console.warn('Alle DWD-Endpoints fehlgeschlagen. Verwende Fallback-Daten.');
  return getFallbackData();
}

// Bright Sky API - DWD verilerini JSON formatında sunan ücretsiz API
async function fetchBrightSkyWeather(): Promise<BiowetterData | null> {
  try {
    // Wiesbaden koordinatları
    const lat = 50.0826;
    const lon = 8.2400;
    const today = new Date().toISOString().split('T')[0];
    
    const url = `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}&date=${today}`;
    
    console.log(`Versuche Bright Sky API: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Biowetter-Wiesbaden/1.0',
      },
      validateStatus: (status) => status < 500,
    });

    if (response.status === 200 && response.data && response.data.weather) {
      console.log('Erfolgreich Daten von Bright Sky API');
      
      // En güncel veriyi al (son saat)
      const weatherData = response.data.weather;
      const latest = weatherData[weatherData.length - 1] || weatherData[0];
      
      if (!latest) {
        return null;
      }

      // DWD verisini format'a çevir
      return {
        region: 'Wiesbaden',
        date: today,
        temperatur: latest.temperature ? Math.round(latest.temperature * 10) / 10 : undefined,
        luftfeuchtigkeit: latest.relative_humidity ? Math.round(latest.relative_humidity) : undefined,
        belastung: getBelastungFromWeather(latest),
        gefuehl: getGefuehlFromWeather(latest),
        beschreibung: getBeschreibungFromWeather(latest),
        warnung: undefined, // Gerçek veri, warnung yok
      };
    }
    
    return null;
  } catch (error: any) {
    console.log(`Bright Sky API fehlgeschlagen: ${error.message}`);
    return null;
  }
}

// Hava durumu verisinden biometeorolojik belastung hesapla
function getBelastungFromWeather(weather: any): string {
  const temp = weather.temperature || 20;
  const humidity = weather.relative_humidity || 60;
  const pressure = weather.pressure_msl || 1013;
  
  // Basit belastung hesaplaması
  let score = 0;
  
  // Sıcaklık faktörü
  if (temp < 10 || temp > 30) score += 2;
  else if (temp < 15 || temp > 25) score += 1;
  
  // Nem faktörü
  if (humidity > 80 || humidity < 30) score += 2;
  else if (humidity > 70 || humidity < 40) score += 1;
  
  // Basınç faktörü
  if (pressure < 1000 || pressure > 1025) score += 1;
  
  // Rüzgar faktörü
  const wind = weather.wind_speed || 0;
  if (wind > 30) score += 2;
  else if (wind > 20) score += 1;
  
  if (score <= 1) return 'Niedrig';
  if (score <= 3) return 'Moderat';
  if (score <= 5) return 'Erhöht';
  return 'Hoch';
}

function getGefuehlFromWeather(weather: any): string {
  const temp = weather.temperature || 20;
  const humidity = weather.relative_humidity || 60;
  
  if (temp >= 18 && temp <= 24 && humidity >= 40 && humidity <= 70) {
    return 'Sehr angenehm';
  } else if (temp >= 15 && temp <= 27 && humidity >= 30 && humidity <= 80) {
    return 'Angenehm';
  } else if (temp < 10 || temp > 30 || humidity > 85) {
    return 'Belastend';
  } else {
    return 'Etwas belastend';
  }
}

function getBeschreibungFromWeather(weather: any): string {
  const belastung = getBelastungFromWeather(weather);
  const gefuehl = getGefuehlFromWeather(weather);
  const temp = weather.temperature || 20;
  const condition = weather.condition || 'dry';
  
  const conditionTexts: { [key: string]: string } = {
    'dry': 'trocken',
    'fog': 'neblig',
    'rain': 'regnerisch',
    'sleet': 'Schneeregen',
    'snow': 'schneebedeckt',
    'hail': 'Hagel',
    'thunderstorm': 'gewitterhaft',
    'wind': 'windig',
  };
  
  const conditionText = conditionTexts[condition] || 'angenehm';
  
  return `Die aktuellen Wetterbedingungen in Wiesbaden sind ${conditionText} mit ${Math.round(temp)}°C. ` +
         `Die biometeorologische Belastung ist ${belastung.toLowerCase()} und wird von den meisten Menschen als ${gefuehl.toLowerCase()} empfunden. ` +
         `Aktuelle Daten werden über die DWD-API (Bright Sky) bereitgestellt.`;
}

// XML verilerini parse et
async function parseDWDXML(xmlData: string, city: string): Promise<BiowetterData | null> {
  try {
    return new Promise((resolve, reject) => {
      parseString(xmlData, { explicitArray: false, mergeAttrs: true }, (err, result) => {
        if (err) {
          console.error('XML Parse Error:', err);
          resolve(null);
          return;
        }

        try {
          // DWD XML yapısına göre parse
          // Genellikle: <warnings><warning><region>...</region></warning></warnings>
          const warnings = result?.warnings?.warning || result?.Warnungen?.Warnung || result?.Warning || [];
          const warningArray = Array.isArray(warnings) ? warnings : [warnings];

          for (const warning of warningArray) {
            const region = (warning.region || warning.Region || warning.name || warning.Name || '').toString().toLowerCase();
            const code = (warning.code || warning.Code || warning.id || warning.Id || '').toString();

            if (region.includes('wiesbaden') || 
                region.includes('hessen') || 
                region.includes('frankfurt') ||
                code === '11' ||
                code === '06414' || // Wiesbaden PLZ
                region.includes('hess')) {
              
              const parsed = formatBiowetterData(warning, city);
              resolve(parsed);
              return;
            }
          }

          // Eğer spesifik bölge bulunamazsa, genel veriyi kullan
          if (warningArray.length > 0) {
            const firstWarning = warningArray[0];
            const parsed = formatBiowetterData(firstWarning, city);
            resolve(parsed);
            return;
          }

          resolve(null);
        } catch (error) {
          console.error('XML Processing Error:', error);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('XML Parse Exception:', error);
    return null;
  }
}

// CSV verilerini parse et
function parseDWDCSV(csvData: string, city: string): BiowetterData | null {
  try {
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    for (const record of records) {
      const region = (record.region || record.Region || record.name || record.Name || record.Stadt || '').toString().toLowerCase();
      const code = (record.code || record.Code || record.id || record.Id || record.PLZ || '').toString();

      if (region.includes('wiesbaden') || 
          region.includes('hessen') || 
          region.includes('frankfurt') ||
          code === '11' ||
          code === '06414') {
        
        return formatBiowetterData(record, city);
      }
    }

    // Eğer spesifik bölge bulunamazsa, ilk kaydı kullan
    if (records.length > 0) {
      return formatBiowetterData(records[0], city);
    }

    return null;
  } catch (error) {
    console.error('CSV Parse Error:', error);
    return null;
  }
}

function parseDWDData(data: any, city: string, sourceUrl?: string): BiowetterData | null {
  try {
    // DWD verilerinin farklı formatlarını destekle
    
    // Format 1: Dizi içinde uyarılar
    if (Array.isArray(data)) {
      const wiesbadenData = data.find((item: any) => {
        const region = (item.region || item.Region || item.name || item.Name || '').toLowerCase();
        const code = (item.code || item.Code || item.id || '').toString();
        
        return region.includes('wiesbaden') || 
               region.includes('hessen') || 
               region.includes('hessen') ||
               code === '11' || // Hessen region code
               region.includes('frankfurt'); // Nähe Wiesbaden
      });
      
      if (wiesbadenData) {
        return formatBiowetterData(wiesbadenData, city);
      }
    }
    
    // Format 2: Obje içinde uyarılar
    if (data && typeof data === 'object') {
      // warnings/warnings/Warnungen anahtarı altında olabilir
      const warnings = data.warnings || data.Warnungen || data.warnings || data.data;
      
      if (Array.isArray(warnings)) {
        const wiesbadenData = warnings.find((w: any) => {
          const region = (w.region || w.Region || w.name || w.Name || '').toLowerCase();
          const code = (w.code || w.Code || w.id || '').toString();
          
          return region.includes('wiesbaden') || 
                 region.includes('hessen') || 
                 code === '11';
        });
        
        if (wiesbadenData) {
          return formatBiowetterData(wiesbadenData, city);
        }
      }
      
      // Direkt obje formatında olabilir
      if (data.region || data.Region || data.belastung || data.Belastung) {
        const region = (data.region || data.Region || '').toLowerCase();
        if (region.includes('wiesbaden') || region.includes('hessen') || region.includes('frankfurt')) {
          return formatBiowetterData(data, city);
        }
      }
    }
    
    // Format 3: GeoJSON formatı
    if (data.features && Array.isArray(data.features)) {
      const wiesbadenFeature = data.features.find((feature: any) => {
        const props = feature.properties || {};
        const region = (props.name || props.Name || props.region || '').toLowerCase();
        return region.includes('wiesbaden') || region.includes('hessen');
      });
      
      if (wiesbadenFeature && wiesbadenFeature.properties) {
        return formatBiowetterData(wiesbadenFeature.properties, city);
      }
    }
    
    console.log('DWD-Daten konnten nicht geparst werden. Struktur:', JSON.stringify(data).substring(0, 200));
    return null;
  } catch (error) {
    console.error('Fehler beim Parsen der DWD-Daten:', error);
    return null;
  }
}

function formatBiowetterData(rawData: any, city: string): BiowetterData {
  // DWD verilerinden standart formatı oluştur
  // Farklı alan isimlerini destekle (XML, CSV, JSON formatları için)
  
  const getValue = (keys: string[], defaultValue?: string) => {
    for (const key of keys) {
      if (rawData[key] !== undefined && rawData[key] !== null) {
        const value = rawData[key];
        // Object ise _text veya $text gibi xml2js yapıları olabilir
        if (typeof value === 'object' && value._text) {
          return String(value._text);
        }
        if (typeof value === 'object' && value.$) {
          return String(value.$);
        }
        return String(value);
      }
    }
    return defaultValue;
  };
  
  const getNumericValue = (keys: string[]) => {
    for (const key of keys) {
      if (rawData[key] !== undefined && rawData[key] !== null) {
        const value = rawData[key];
        const num = typeof value === 'object' && value._text 
          ? parseFloat(value._text) 
          : parseFloat(String(value));
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return undefined;
  };
  
  // Belastungsstufen mapping (DWD'den gelen değerleri standartlaştır)
  const normalizeBelastung = (value?: string): string => {
    if (!value) return 'Moderat';
    const lower = value.toLowerCase();
    if (lower.includes('niedrig') || lower.includes('low') || lower.includes('1')) return 'Niedrig';
    if (lower.includes('moderat') || lower.includes('moderate') || lower.includes('2')) return 'Moderat';
    if (lower.includes('erhöht') || lower.includes('high') || lower.includes('3')) return 'Erhöht';
    if (lower.includes('hoch') || lower.includes('very high') || lower.includes('4')) return 'Hoch';
    return 'Moderat';
  };
  
  return {
    region: city,
    date: getValue(['date', 'Date', 'datum', 'Datum', 'issued', 'Issued', 'zeit', 'Zeit', 'timestamp']) || 
          new Date().toISOString().split('T')[0],
    belastung: normalizeBelastung(getValue(['belastung', 'Belastung', 'stress', 'Stress', 'belastungstufe', 'Belastungsstufe', 'level', 'Level', 'stufe', 'Stufe'])),
    gefuehl: getValue(['gefuehl', 'Gefühl', 'feeling', 'Feeling', 'empfinden', 'Empfinden', 'befinden', 'Befinden'], 'Angenehm'),
    beschreibung: getValue(['beschreibung', 'Beschreibung', 'description', 'Description', 'text', 'Text', 'hinweis', 'Hinweis', 'meldung', 'Meldung'], 
                          'Die biometeorologischen Bedingungen sind für die meisten Menschen als angenehm zu bezeichnen.'),
    warnung: getValue(['warnung', 'Warnung', 'warning', 'Warning', 'alert', 'Alert', 'hinweis', 'Hinweis']),
    temperatur: getNumericValue(['temperatur', 'Temperatur', 'temperature', 'Temperature', 'temp', 'Temp', 't', 'T']),
    luftfeuchtigkeit: getNumericValue(['luftfeuchtigkeit', 'Luftfeuchtigkeit', 'humidity', 'Humidity', 'feuchte', 'Feuchte', 'rh', 'RH', 'relativeHumidity']),
  };
}

function getFallbackData(): BiowetterData {
  // Fallback veri - DWD endpoint'lerinden veri alınamadığında kullanılır
  // Bu veri gerçek DWD verilerini temsil etmez, sadece UI testi için kullanılır
  // Production'da DWD'nin gerçek endpoint'lerini bulmak gereklidir
  
  const heute = new Date();
  
  return {
    region: 'Wiesbaden',
    date: heute.toISOString().split('T')[0],
    belastung: 'Moderat',
    gefuehl: 'Angenehm',
    beschreibung: 'Die biometeorologischen Daten werden aktuell geladen. Falls diese Meldung länger erscheint, könnte der DWD-Server vorübergehend nicht erreichbar sein. Bitte versuchen Sie es später erneut.',
    warnung: 'Hinweis: Fallback-Daten werden angezeigt. Die DWD-Endpoints konnten nicht erreicht werden.',
    temperatur: undefined,
    luftfeuchtigkeit: undefined,
  };
}

// Notiz: DWD FTP Alternative
// Falls HTTP endpoint'ler çalışmazsa, FTP üzerinden de veri çekilebilir
// DWD FTP: ftp://opendata.dwd.de/climate_environment/health/alerts/
// Ancak HTTP üzerinden erişim daha kolay ve modern uygulamalar için önerilir

// Polen ve Gefahrenindizes için helper fonksiyonlar
// Not: Bu fonksiyonlar direkt olarak DWD verilerini çeker
// Internal API çağrıları yerine direkt DWD endpoint'lerini kullanır
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
        
        // Basit parse (pollen.ts'deki parsePollenData mantığını kullan)
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
  
  return null;
}

async function fetchGefahrenindizesDataInternal(): Promise<{
  uvIndex?: number;
  uvIndexStufe?: string;
  ozon?: number;
  ozonStufe?: string;
} | null> {
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

  // UV-Index çek
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

  // Ozon çek
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
    return null;
  }

  return {
    uvIndex,
    uvIndexStufe: uvIndex !== undefined ? (uvIndex <= 2 ? 'Niedrig' : uvIndex <= 5 ? 'Moderat' : uvIndex <= 7 ? 'Hoch' : uvIndex <= 10 ? 'Sehr hoch' : 'Extrem hoch') : undefined,
    ozon,
    ozonStufe: ozon !== undefined ? (ozon < 120 ? 'Niedrig' : ozon < 180 ? 'Moderat' : ozon < 240 ? 'Erhöht' : 'Hoch') : undefined,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BiowetterData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Tüm verileri paralel olarak çek
    const [biowetterData, pollenData, gefahrenindizesData] = await Promise.all([
      fetchDWDData(),
      fetchPollenDataInternal(),
      fetchGefahrenindizesDataInternal(),
    ]);
    
    // Biowetter verisi yoksa hata döndür
    if (!biowetterData) {
      return res.status(500).json({ error: 'Biowetter verisi alınamadı' });
    }
    
    // Diğer verileri ekle
    const combinedData: BiowetterData = {
      ...biowetterData,
    };
    
    // Polen verilerini ekle
    if (pollenData) {
      combinedData.pollen = pollenData;
    }
    
    // Gefahrenindizes verilerini ekle
    if (gefahrenindizesData) {
      combinedData.uvIndex = gefahrenindizesData.uvIndex;
      combinedData.uvIndexStufe = gefahrenindizesData.uvIndexStufe;
      combinedData.ozon = gefahrenindizesData.ozon;
      combinedData.ozonStufe = gefahrenindizesData.ozonStufe;
    }
    
    res.status(200).json(combinedData);
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Hata durumunda bile biowetter verisini döndürmeye çalış
    const biowetterData = await fetchDWDData().catch(() => null);
    if (biowetterData) {
      return res.status(200).json(biowetterData);
    }
    
    res.status(500).json({ error: error.message || 'Sunucu hatası' });
  }
}

