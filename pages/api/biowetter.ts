import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface BiowetterData {
  region: string;
  date: string;
  belastung?: string;
  gefuehl?: string;
  beschreibung?: string;
  warnung?: string;
  temperatur?: number;
  luftfeuchtigkeit?: number;
}

// DWD Open Data'dan Wiesbaden için biyometeorolojik veri çekme
// DWD API key gerektirmez - önceden oluşturulmuş dosyalara doğrudan HTTP ile erişim
async function fetchDWDData(): Promise<BiowetterData | null> {
  const baseUrl = 'https://opendata.dwd.de';
  
  // DWD'nin biyometeorolojik veriler için olası endpoint'ler
  // Bu dosyalar düzenli olarak güncellenir ve herkese açıktır
  const possibleEndpoints = [
    // Biyometeorolojik uyarılar - Genel
    `${baseUrl}/climate_environment/health/alerts/warnings/bgww.json`,
    `${baseUrl}/climate_environment/health/alerts/warnings/BGWW.json`,
    
    // Biyometeorolojik tahminler
    `${baseUrl}/climate_environment/health/alerts/biometeorology/biometeorology.json`,
    
    // Hessen bölgesi için spesifik veriler
    `${baseUrl}/climate_environment/health/alerts/warnings/hessen.json`,
    
    // Alternatif: CSV format (JSON'a dönüştürülebilir)
    `${baseUrl}/climate_environment/health/alerts/warnings/biometeorology.csv`,
  ];

  // Her bir endpoint'i sırayla dene
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Versuche DWD-Endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json, text/csv, */*',
          'User-Agent': 'Biowetter-Wiesbaden/1.0',
        },
        validateStatus: (status) => status < 500, // 4xx hataları için bile devam et
      });

      // Başarılı istek kontrolü
      if (response.status === 200 && response.data) {
        console.log(`Erfolgreich Daten von: ${endpoint}`);
        
        // Veriyi parse et
        const parsedData = parseDWDData(response.data, 'Wiesbaden', endpoint);
        
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
  // Farklı alan isimlerini destekle
  
  const getValue = (keys: string[], defaultValue?: string) => {
    for (const key of keys) {
      if (rawData[key] !== undefined && rawData[key] !== null) {
        return String(rawData[key]);
      }
    }
    return defaultValue;
  };
  
  return {
    region: city,
    date: getValue(['date', 'Date', 'datum', 'Datum', 'issued', 'Issued']) || 
          new Date().toISOString().split('T')[0],
    belastung: getValue(['belastung', 'Belastung', 'stress', 'Stress', 'belastungstufe', 'Belastungsstufe'], 'Moderat'),
    gefuehl: getValue(['gefuehl', 'Gefühl', 'feeling', 'Feeling', 'empfinden', 'Empfinden'], 'Angenehm'),
    beschreibung: getValue(['beschreibung', 'Beschreibung', 'description', 'Description', 'text', 'Text'], 
                          'Die biometeorologischen Bedingungen sind für die meisten Menschen als angenehm zu bezeichnen.'),
    warnung: getValue(['warnung', 'Warnung', 'warning', 'Warning', 'alert', 'Alert']),
    temperatur: rawData.temperatur || rawData.Temperatur || rawData.temperature || rawData.Temperature || undefined,
    luftfeuchtigkeit: rawData.luftfeuchtigkeit || rawData.Luftfeuchtigkeit || 
                     rawData.humidity || rawData.Humidity || 
                     rawData.relativeHumidity || undefined,
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BiowetterData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await fetchDWDData();
    
    if (!data) {
      return res.status(500).json({ error: 'Veri alınamadı' });
    }
    
    res.status(200).json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Sunucu hatası' });
  }
}

