# Deployment Anleitung

## GitHub Repository erstellen

1. GitHub'da ein neues Repository erstellen:
   - Name: `biowetter-wiesbaden`
   - Beschreibung: "Biowetter Wiesbaden - DWD Open Data Integration"
   - Öffentlich oder Privat wählen

2. Lokales Repository initialisieren:
```bash
git init
git add .
git commit -m "Initial commit: Biowetter Wiesbaden project"
git branch -M main
git remote add origin https://github.com/ihr-username/biowetter-wiesbaden.git
git push -u origin main
```

## Vercel Deployment

### Option 1: Über Vercel Dashboard

1. Gehen Sie zu [vercel.com](https://vercel.com)
2. Melden Sie sich an (mit GitHub Account)
3. Klicken Sie auf "New Project"
4. Wählen Sie das Repository `biowetter-wiesbaden`
5. Vercel erkennt automatisch Next.js
6. Klicken Sie auf "Deploy"
7. Die Anwendung wird automatisch deployed und Sie erhalten eine URL

### Option 2: Über Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Folgen Sie den Anweisungen und die Anwendung wird deployed.

## Automatische Deployments

Nach der ersten Deployment werden alle neuen Commits automatisch deployed:
- `main` Branch → Production
- Andere Branches → Preview Deployments

## Umgebungsvariablen (falls nötig)

Falls später Umgebungsvariablen benötigt werden:
1. Gehen Sie zum Vercel Dashboard
2. Wählen Sie das Projekt
3. Settings → Environment Variables
4. Fügen Sie die Variablen hinzu

## Überprüfung nach Deployment

- ✅ Anwendung ist erreichbar
- ✅ API Route `/api/biowetter` funktioniert
- ✅ Daten werden korrekt angezeigt
- ✅ Responsive Design funktioniert

## Probleme beheben

### Build-Fehler
- Überprüfen Sie die Build-Logs in Vercel
- Testen Sie lokal mit `npm run build`

### API-Fehler
- Überprüfen Sie die DWD API-Verfügbarkeit
- Fallback-Mechanismus sollte aktiv sein

### CORS-Probleme
- Überprüfen Sie `next.config.js` für CORS-Header

## Support

Bei Problemen:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- DWD Open Data: https://opendata.dwd.de

