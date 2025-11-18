import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q61RPHYM85"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Q61RPHYM85');
            `,
          }}
        />
        {/* Structured Data - JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Biowetter Wiesbaden',
              description: 'Aktuelle biometeorologische Daten für Wiesbaden basierend auf DWD Open Data',
              url: 'https://biowetter-wiesbaden.vercel.app/',
              applicationCategory: 'HealthApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
              },
              provider: {
                '@type': 'Organization',
                name: 'Deutscher Wetterdienst (DWD)',
                url: 'https://www.dwd.de',
              },
              author: {
                '@type': 'Person',
                name: 'Gökhan Yasar',
                email: 'goekhan.yasar@gmx.de',
              },
              inLanguage: 'de-DE',
              areaServed: {
                '@type': 'City',
                name: 'Wiesbaden',
                containedIn: {
                  '@type': 'State',
                  name: 'Hessen',
                  containedIn: {
                    '@type': 'Country',
                    name: 'Deutschland',
                  },
                },
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: '50.0826',
                longitude: '8.2400',
              },
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}



