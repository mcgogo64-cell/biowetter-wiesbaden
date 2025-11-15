import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  pollen?: {
    [key: string]: number; // Polen türü -> Yoğunluk (0-3)
  };
  uvIndex?: number;
  uvIndexStufe?: string;
  ozon?: number;
  ozonStufe?: string;
}

export default function Home() {
  const [data, setData] = useState<BiowetterData | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchBiowetter();
    
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
        <title>Biowetter Wiesbaden - DWD Daten</title>
        <meta name="description" content="Biowetter für Wiesbaden basierend auf DWD Open Data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7b6cf6" />
      </Head>

      <main>
        <div className="container">
          <div className="header">
            <div className="header-content">
              <span className="header-icon">🌤️</span>
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
                <span className="date-icon">📅</span>
                <span>{data.region} - {formatDate(data.date)}</span>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-item-icon">⚡</span>
                    <h3>Biometeorologische Belastung</h3>
                    <p>
                      <span className={getBadgeClass(data.belastung)}>
                        {data.belastung || 'Nicht verfügbar'}
                      </span>
                    </p>
                  </div>

                  <div className="info-item">
                    <span className="info-item-icon">😊</span>
                    <h3>Empfinden</h3>
                    <p>{data.gefuehl || 'Nicht verfügbar'}</p>
                  </div>

                  {data.temperatur && (
                    <div className="info-item">
                      <span className="info-item-icon">🌡️</span>
                      <h3>Temperatur</h3>
                      <p>{data.temperatur}°C</p>
                    </div>
                  )}

                  {data.luftfeuchtigkeit && (
                    <div className="info-item">
                      <span className="info-item-icon">💧</span>
                      <h3>Luftfeuchtigkeit</h3>
                      <p>{data.luftfeuchtigkeit}%</p>
                    </div>
                  )}

                  {data.uvIndex !== undefined && (
                    <div className="info-item">
                      <span className="info-item-icon">☀️</span>
                      <h3>UV-Index</h3>
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
                      <span className="info-item-icon">☁️</span>
                      <h3>Ozon</h3>
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
                      <span>🌸</span>
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
          </div>
        </div>
      </main>
    </>
  );
}

