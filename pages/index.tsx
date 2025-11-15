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
      </Head>

      <main>
        <div className="container">
          <div className="header">
            <h1>🌤️ Biowetter Wiesbaden</h1>
            <p>Biyometeorolojik Veriler - DWD Open Data</p>
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
              <h2 style={{ marginBottom: '1rem', color: '#667eea', fontSize: '1.8rem' }}>
                {data.region} - {formatDate(data.date)}
              </h2>

              <div style={{ marginTop: '1.5rem' }}>
                <div className="info-grid">
                  <div className="info-item">
                    <h3>Biometeorologische Belastung</h3>
                    <p>
                      <span className={getBadgeClass(data.belastung)}>
                        {data.belastung || 'Nicht verfügbar'}
                      </span>
                    </p>
                  </div>

                  <div className="info-item">
                    <h3>Empfinden</h3>
                    <p>{data.gefuehl || 'Nicht verfügbar'}</p>
                  </div>

                  {data.temperatur && (
                    <div className="info-item">
                      <h3>Temperatur</h3>
                      <p>{data.temperatur}°C</p>
                    </div>
                  )}

                  {data.luftfeuchtigkeit && (
                    <div className="info-item">
                      <h3>Luftfeuchtigkeit</h3>
                      <p>{data.luftfeuchtigkeit}%</p>
                    </div>
                  )}

                  {data.uvIndex !== undefined && (
                    <div className="info-item">
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
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h3 style={{ color: '#667eea', marginBottom: '1rem', fontSize: '1.1rem' }}>
                      🌸 Pollenflug (Polen Uçuşu)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                      {Object.entries(data.pollen).map(([pollenType, level]) => (
                        <div key={pollenType} style={{ padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                            {pollenType}
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                            <span className={getPollenBadgeClass(level)}>
                              {getPollenLevelText(level)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.beschreibung && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h3 style={{ color: '#667eea', marginBottom: '1rem', fontSize: '1.1rem' }}>
                      Beschreibung
                    </h3>
                    <p style={{ lineHeight: '1.8', color: '#555', fontSize: '1rem' }}>
                      {data.beschreibung}
                    </p>
                  </div>
                )}

                {data.warnung && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    padding: '1rem', 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ffc107'
                  }}>
                    <h3 style={{ color: '#856404', marginBottom: '0.5rem', fontSize: '1rem' }}>
                      ⚠️ Warnung
                    </h3>
                    <p style={{ color: '#856404', lineHeight: '1.6' }}>
                      {data.warnung}
                    </p>
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
              Datenquelle:{' '}
              <a 
                href="https://www.dwd.de/DE/leistungen/opendata/opendata.html" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Deutscher Wetterdienst (DWD) Open Data
              </a>
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Standort: Wiesbaden, Hessen, Deutschland
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

