import { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import axios from 'axios';
import { 
  Activity, 
  Smile, 
  Thermometer, 
  Droplets, 
  Sun, 
  Cloud,
  Flower2,
  Calendar,
  CloudSun
} from 'lucide-react';
import { getBiowetterData, BiowetterData } from '../lib/biowetter-data';

interface HomeProps {
  initialData: BiowetterData;
}

export default function Home({ initialData }: HomeProps) {
  const [data, setData] = useState<BiowetterData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBiowetter = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<BiowetterData>('/api/biowetter');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
      console.error('Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always apply dark theme
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
  }, []);

  const getBadgeClass = (belastung?: string) => {
    if (!belastung) return 'badge badge-low';
    const lower = belastung.toLowerCase();
    if (lower.includes('niedrig') || lower.includes('low')) return 'badge badge-low';
    if (lower.includes('moderat') || lower.includes('moderate')) return 'badge badge-moderate';
    if (lower.includes('erhöht') || lower.includes('high')) return 'badge badge-high';
    if (lower.includes('hoch') || lower.includes('very high') || lower.includes('sehr hoch')) return 'badge badge-very-high';
    if (lower.includes('extrem')) return 'badge badge-very-high';
    return 'badge badge-moderate';
  };

  const getPollenBadgeClass = (level: number): string => {
    if (level === 0) return 'badge badge-low';
    if (level === 1) return 'badge badge-low';
    if (level === 2) return 'badge badge-moderate';
    if (level === 3) return 'badge badge-high';
    return 'badge badge-moderate';
  };

  const getPollenLevelText = (level: number): string => {
    const levels = ['Keine', 'Niedrig', 'Mittel', 'Hoch'];
    return levels[level] || 'Unbekannt';
  };

  // Icon Pill Component
  const IconPill = ({ 
    icon: Icon, 
    gradient, 
    shadowColor 
  }: { 
    icon: React.ElementType; 
    gradient: string;
    shadowColor: string;
  }) => (
    <div 
      className="icon-pill"
      style={{
        background: gradient,
        boxShadow: `0 0 18px ${shadowColor}`,
      }}
    >
      <Icon size={24} strokeWidth={1.8} color="#E5E7EB" />
    </div>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>Biowetter Wiesbaden - Aktuelle biometeorologische Daten | DWD Open Data</title>
        <meta name="title" content="Biowetter Wiesbaden - Aktuelle biometeorologische Daten | DWD Open Data" />
        <meta name="description" content="Aktuelle biometeorologische Daten für Wiesbaden: Belastungsindex, Pollenflug, UV-Index und Ozon-Vorhersage. Basierend auf offiziellen DWD (Deutscher Wetterdienst) Open Data." />
        <meta name="keywords" content="Biowetter, Wiesbaden, DWD, Pollenflug, UV-Index, Ozon, biometeorologisch, Wetter, Hessen, Deutschland, Gesundheit, Allergie" />
        <meta name="author" content="Gökhan Yasar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="language" content="de" />
        <meta httpEquiv="content-language" content="de-DE" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://biowetter-wiesbaden.vercel.app/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://biowetter-wiesbaden.vercel.app/" />
        <meta property="og:title" content="Biowetter Wiesbaden - Aktuelle biometeorologische Daten | DWD Open Data" />
        <meta property="og:description" content="Aktuelle biometeorologische Daten für Wiesbaden: Belastungsindex, Pollenflug, UV-Index und Ozon-Vorhersage. Basierend auf offiziellen DWD Open Data." />
        <meta property="og:image" content="https://biowetter-wiesbaden.vercel.app/og-image.png" />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:site_name" content="Biowetter Wiesbaden" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://biowetter-wiesbaden.vercel.app/" />
        <meta property="twitter:title" content="Biowetter Wiesbaden - Aktuelle biometeorologische Daten" />
        <meta property="twitter:description" content="Aktuelle biometeorologische Daten für Wiesbaden: Belastungsindex, Pollenflug, UV-Index und Ozon-Vorhersage vom DWD." />
        <meta property="twitter:image" content="https://biowetter-wiesbaden.vercel.app/og-image.png" />
        
        {/* Favicon & App */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1E1E2E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Biowetter Wiesbaden" />
        
        {/* Geo Tags */}
        <meta name="geo.region" content="DE-HE" />
        <meta name="geo.placename" content="Wiesbaden" />
        <meta name="geo.position" content="50.0826;8.2400" />
        <meta name="ICBM" content="50.0826, 8.2400" />
      </Head>

      <main>
        <div className="container">
          <div className="header">
            <div className="header-content">
              <IconPill 
                icon={CloudSun} 
                gradient="linear-gradient(135deg, #4F46E5, #06B6D4)"
                shadowColor="rgba(56, 189, 248, 0.45)"
              />
              <h1>Biowetter Wiesbaden</h1>
            </div>
            <p>Biometeorologische Daten - DWD Open Data</p>
            <p className="header-subtitle">Realtime Data from DWD</p>
          </div>

          {loading && (
            <div className="loading">
              <p>Daten werden geladen...</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>{error}</p>
              <button 
                className="refresh-button" 
                onClick={fetchBiowetter}
                style={{ marginTop: '1rem', width: 'auto' }}
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="card">
              <div className="date-header">
                <IconPill 
                  icon={Calendar} 
                  gradient="linear-gradient(135deg, #4F46E5, #06B6D4)"
                  shadowColor="rgba(56, 189, 248, 0.45)"
                />
                <span>{data.region} - {formatDate(data.date)}</span>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-item-header">
                      <IconPill 
                        icon={Activity} 
                        gradient="linear-gradient(135deg, #FBBF24, #F97316)"
                        shadowColor="rgba(251, 191, 36, 0.45)"
                      />
                      <h3>Biometeorologische Belastung</h3>
                    </div>
                    <p>
                      <span className={getBadgeClass(data.belastung)}>
                        {data.belastung || 'Nicht verfügbar'}
                      </span>
                    </p>
                  </div>

                  <div className="info-item">
                    <div className="info-item-header">
                      <IconPill 
                        icon={Smile} 
                        gradient="linear-gradient(135deg, #8B5CF6, #6366F1)"
                        shadowColor="rgba(139, 92, 246, 0.45)"
                      />
                      <h3>Empfinden</h3>
                    </div>
                    <p>{data.gefuehl || 'Nicht verfügbar'}</p>
                  </div>

                  {data.temperatur && (
                    <div className="info-item">
                      <div className="info-item-header">
                        <IconPill 
                          icon={Thermometer} 
                          gradient="linear-gradient(135deg, #F97316, #EF4444)"
                          shadowColor="rgba(249, 115, 22, 0.45)"
                        />
                        <h3>Temperatur</h3>
                      </div>
                      <p>{data.temperatur}°C</p>
                    </div>
                  )}

                  {data.luftfeuchtigkeit && (
                    <div className="info-item">
                      <div className="info-item-header">
                        <IconPill 
                          icon={Droplets} 
                          gradient="linear-gradient(135deg, #06B6D4, #3B82F6)"
                          shadowColor="rgba(6, 182, 212, 0.45)"
                        />
                        <h3>Luftfeuchtigkeit</h3>
                      </div>
                      <p>{data.luftfeuchtigkeit}%</p>
                    </div>
                  )}

                  {data.uvIndex !== undefined && (
                    <div className="info-item">
                      <div className="info-item-header">
                        <IconPill 
                          icon={Sun} 
                          gradient={`linear-gradient(135deg, ${
                            data.uvIndexStufe?.toLowerCase().includes('niedrig') ? '#22C55E' :
                            data.uvIndexStufe?.toLowerCase().includes('moderat') ? '#FBBF24' :
                            '#EF4444'
                          }, ${
                            data.uvIndexStufe?.toLowerCase().includes('niedrig') ? '#16A34A' :
                            data.uvIndexStufe?.toLowerCase().includes('moderat') ? '#F59E0B' :
                            '#DC2626'
                          })`}
                          shadowColor={`rgba(${
                            data.uvIndexStufe?.toLowerCase().includes('niedrig') ? '34, 197, 94' :
                            data.uvIndexStufe?.toLowerCase().includes('moderat') ? '251, 191, 36' :
                            '239, 68, 68'
                          }, 0.45)`}
                        />
                        <h3>UV-Index</h3>
                      </div>
                      <p>
                        {data.uvIndex}
                        {data.uvIndexStufe && (
                          <span className={getBadgeClass(data.uvIndexStufe)} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                            {data.uvIndexStufe}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {data.ozon !== undefined && (
                    <div className="info-item">
                      <div className="info-item-header">
                        <IconPill 
                          icon={Cloud} 
                          gradient="linear-gradient(135deg, #60A5FA, #93C5FD)"
                          shadowColor="rgba(96, 165, 250, 0.45)"
                        />
                        <h3>Ozon</h3>
                      </div>
                      <p>
                        {data.ozon} µg/m³
                        {data.ozonStufe && (
                          <span className={getBadgeClass(data.ozonStufe)} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                            {data.ozonStufe}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pollenflug Sektion */}
                {data.pollen && Object.keys(data.pollen).length > 0 && (
                  <div className="pollen-section">
                    <div className="pollen-header">
                      <IconPill 
                        icon={Flower2} 
                        gradient="linear-gradient(135deg, #EC4899, #F472B6)"
                        shadowColor="rgba(236, 72, 153, 0.45)"
                      />
                      <span>Pollenflug</span>
                    </div>
                    <div className="pollen-grid">
                      {Object.entries(data.pollen).map(([pollenType, level]) => {
                        const levelText = getPollenLevelText(level);
                        const pollenClass = level === 0 ? 'pollen-keine' : level === 2 ? 'pollen-mittel' : level === 3 ? 'pollen-hoch' : 'pollen-keine';
                        
                        return (
                          <div key={pollenType} className="pollen-item">
                            <div className="pollen-item-name">{pollenType}</div>
                            <div className="pollen-item-value">
                              <span className={`badge ${pollenClass}`}>
                                {levelText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {data.beschreibung && (
                  <div className="description-section">
                    <h3>Beschreibung</h3>
                    <p>{data.beschreibung}</p>
                  </div>
                )}

                {data.warnung && (
                  <div className="warning-section">
                    <h3>⚠️ Warnung</h3>
                    <p>{data.warnung}</p>
                  </div>
                )}

                <button 
                  className="refresh-button" 
                  onClick={fetchBiowetter}
                  disabled={loading}
                >
                  {loading ? 'Lädt...' : 'Daten aktualisieren'}
                </button>
              </div>
            </div>
          )}

          <div className="footer">
            <p>
              © 2025 Biowetter Wiesbaden – Data by{' '}
              <a 
                href="https://www.dwd.de/DE/leistungen/opendata/opendata.html" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                DWD Open Data
              </a>
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
              Standort: Wiesbaden, Hessen, Deutschland
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
              Kontakt:{' '}
              <a href="mailto:goekhan.yasar@gmx.de" style={{ textDecoration: 'underline' }}>
                goekhan.yasar@gmx.de
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

// SSR - Server-Side Rendering
// Her istekte güncel veri çekilir, kullanıcılar her zaman en yeni veriyi görür
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const data = await getBiowetterData();
    
    return {
      props: {
        initialData: data,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    // Fallback data
    return {
      props: {
        initialData: {
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
        },
      },
    };
  }
};

