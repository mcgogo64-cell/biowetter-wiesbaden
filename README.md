# Biowetter Wiesbaden

Biowetter Wiesbaden ist eine Web-Anwendung, die biometeorologische Daten für Wiesbaden aus den offenen Datenquellen des Deutschen Wetterdienstes (DWD) abruft und anzeigt.

## 🌤️ Features

- **Biometeorologische Daten**: Aktuelle Belastungs- und Empfindungsstufen
- **DWD Open Data Integration**: Direkte Datenabfrage vom Deutschen Wetterdienst (via Bright Sky API)
- **Pollenflug**: 8 Pollenarten mit aktuellen Belastungsstufen
- **UV-Index & Ozon**: Tagesaktuelle Gefahrenindizes
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Dark Theme**: Modernes dunkles Design mit Glassmorphism-Effekten
- **SVG Icons**: Lucide Icons für professionelles Erscheinungsbild
- **Deutsche Sprache**: Vollständig auf Deutsch
- **PWA**: Als App installierbar auf mobilen Geräten
- **SEO Optimiert**: Vollständige Meta-Tags, Structured Data, Sitemap

## 🚀 Technologie-Stack

- **Next.js 16** - React Framework mit SSG/SSR
- **TypeScript** - Typsichere Programmierung
- **Lucide React** - Moderne SVG Icon Library
- **Axios** - HTTP Client für API-Anfragen
- **Bright Sky API** - DWD Daten in JSON Format
- **CSS3** - Modernes Dark Theme mit Glassmorphism
- **PWA** - Progressive Web App Support

## 📦 Installation

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn

### Lokale Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/ihr-username/biowetter-wiesbaden.git
cd biowetter-wiesbaden
```

2. Dependencies installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

4. Browser öffnen: [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment auf Vercel

### Über GitHub

1. Repository auf GitHub hochladen
2. [Vercel](https://vercel.com) besuchen und sich anmelden
3. "New Project" erstellen
4. GitHub Repository auswählen
5. Vercel erkennt automatisch Next.js und deployt die Anwendung

### Über Vercel CLI

```bash
npm i -g vercel
vercel
```

## 📡 DWD Open Data

Diese Anwendung nutzt die offenen Daten des Deutschen Wetterdienstes (DWD):

- **DWD Open Data Portal**: https://opendata.dwd.de
- **Kein API Key erforderlich**: DWD Open Data ist vollständig öffentlich zugänglich
- **Dokumentation**: https://www.dwd.de/DE/leistungen/opendata/opendata.html

### Wie funktioniert DWD Open Data?

**Wichtig**: DWD Open Data funktioniert **nicht** wie eine traditionelle REST API mit API Keys. Stattdessen:

1. **Öffentliche Dateien**: DWD stellt seine Daten als vorab generierte Dateien (JSON, CSV, GeoJSON) auf einem öffentlichen Server bereit
2. **Direkter Zugriff**: Diese Dateien sind über HTTP ohne Authentifizierung erreichbar
3. **Regelmäßige Updates**: Die Dateien werden in regelmäßigen Abständen (z.B. täglich) aktualisiert
4. **URL-basiert**: Sie müssen nur die richtige URL kennen, um auf die Daten zuzugreifen

### Datenquelle

Die biometeorologischen Daten werden direkt von DWD Open Data-Servern abgerufen:

```
https://opendata.dwd.de/climate_environment/health/alerts/warnings/
```

Die Anwendung versucht verschiedene mögliche Endpoints und sucht nach Daten für Wiesbaden/Hessen. Falls kein Endpoint verfügbar ist, wird ein Fallback-Mechanismus verwendet.

## 📝 API Routes

### `/api/biowetter`

Gibt die vollständigen biometeorologischen Daten für Wiesbaden zurück (kombiniert alle Datenquellen).

**Response:**
```json
{
  "region": "Wiesbaden",
  "date": "2025-11-15",
  "belastung": "Moderat",
  "gefuehl": "Angenehm",
  "beschreibung": "Aktuelle Wetterbedingungen in Wiesbaden...",
  "temperatur": 8.6,
  "luftfeuchtigkeit": 99,
  "pollen": {
    "Hasel": 0,
    "Erle": 0,
    "Birke": 0,
    "Gräser": 0,
    "Roggen": 0,
    "Beifuß": 0,
    "Ambrosia": 0
  },
  "uvIndex": 3,
  "uvIndexStufe": "Moderat",
  "ozon": 76,
  "ozonStufe": "Niedrig"
}
```

### `/api/pollen`

Nur Pollenflug-Daten.

### `/api/gefahrenindizes`

Nur UV-Index und Ozon-Daten.

### `/api/weather-real`

Aktuelle Wetterdaten via Bright Sky API (DWD Quelle).

## 🔧 Scripts

- `npm run dev` - Entwicklungsserver starten
- `npm run build` - Production Build erstellen
- `npm run start` - Production Server starten
- `npm run lint` - Code linting

## 📄 Lizenz

MIT License

## 👤 Autor

Gökhan Yasar  
📧 goekhan.yasar@gmx.de  
🌐 [https://biowetter-wiesbaden.vercel.app/](https://biowetter-wiesbaden.vercel.app/)

## 🙏 Danksagungen

- Deutscher Wetterdienst (DWD) für die Bereitstellung offener Daten
- Vercel für das Hosting

## 🔗 Links

- [Live Demo](https://biowetter-wiesbaden.vercel.app/)
- [GitHub Repository](https://github.com/mcgogo64-cell/biowetter-wiesbaden)
- [DWD Open Data](https://opendata.dwd.de)
- [Bright Sky API](https://brightsky.dev/)
- [DWD Website](https://www.dwd.de)
- [Vercel](https://vercel.com)
- [Lucide Icons](https://lucide.dev/)

## 🔍 SEO Features

- ✅ Vollständige Meta Tags (Title, Description, Keywords)
- ✅ Open Graph Tags (Facebook, LinkedIn)
- ✅ Twitter Card Tags
- ✅ Structured Data (JSON-LD Schema.org)
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Canonical URLs
- ✅ Geo-Tags (Wiesbaden Koordinaten)
- ✅ Language Tags (de-DE)
- ✅ Security Headers

