// Generates partners/<id>.html: one fictional booking page per provider in data/providers.json.
// The pages are static. They read the reservation from the link, show it, and send the visitor
// back to the app (see partners/partner.js). Run: node scripts/gen-partners.js

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const { providers } = JSON.parse(readFileSync('data/providers.json', 'utf8'));

const COPY = {
  site: { button: 'Reservering bevestigen', note: 'Je ontvangt (in deze demo) geen e-mail: alles blijft in de app.' },
  agency: { button: 'Offerte aanvaarden', note: 'Een bureau stuurt in het echt eerst een offerte. In deze demo is die direct akkoord.' },
  direct: { button: 'Aanvraag versturen', note: 'In het echt neem je contact op met de zaak zelf. In deze demo loopt het via deze pagina.' },
};

const escapeHtml = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

mkdirSync('partners', { recursive: true });

for (const provider of providers) {
  const copy = COPY[provider.kind] ?? COPY.site;
  const html = `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${escapeHtml(provider.name)} — reserveren (demo)</title>
    <link rel="stylesheet" href="../css/tokens.css" />
    <link rel="stylesheet" href="../css/fonts.css" />
    <link rel="stylesheet" href="partner.css" />
    <script type="module" src="partner.js"></script>
  </head>
  <body data-partner="${escapeHtml(provider.id)}" data-button="${escapeHtml(copy.button)}">
    <header class="demo-banner">Fictieve boekingssite · demo · geen echt bedrijf</header>
    <main class="page">
      <h1>${escapeHtml(provider.name)}</h1>
      <p class="lead">${escapeHtml(provider.description)}</p>

      <section class="summary" aria-live="polite">
        <h2>Jouw reservering</h2>
        <dl>
          <dt>Plek</dt><dd data-venue></dd>
          <dt>Wanneer</dt><dd data-when></dd>
          <dt>Personen</dt><dd data-persons></dd>
          <dt>Wensen</dt><dd data-requests></dd>
          <dt>Referentie</dt><dd data-ref class="mono"></dd>
        </dl>
      </section>

      <p class="error" data-error hidden>Deze pagina mist gegevens. Ga terug naar Aether en start de reservering opnieuw.</p>
      <div class="actions">
        <button type="button" class="primary" data-confirm>${escapeHtml(copy.button)}</button>
        <button type="button" class="secondary" data-cancel>Terug naar Aether</button>
      </div>
      <p class="note">${escapeHtml(copy.note)}</p>
    </main>
  </body>
</html>
`;
  writeFileSync(`partners/${provider.id}.html`, html);
}
console.log(`${providers.length} partner pages written`);
