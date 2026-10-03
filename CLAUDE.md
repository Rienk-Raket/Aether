# Aether

Offline-first PWA die de eerlijkste ontmoetingslocatie voor een groep berekent op basis van reistijd.
Volledige specificatie: @docs/SPEC.md (lees alleen de sectie die je nodig hebt, niet het hele bestand per taak).

## Over mij (de gebruiker)
- Ik ben beginner in JavaScript. Leg keuzes kort en in gewoon Nederlands uit; geen jargon zonder uitleg.
- Praat Nederlands met mij. Code, variabelen en commit-berichten in het Engels. UI-teksten in het Nederlands.

## Stack (vast, wijk hier niet vanaf zonder te vragen)
- Vanilla JS met ES modules, geen bundler, geen framework.
- Three.js, idb (IndexedDB), Mapbox (optioneel), Service Worker + manifest.json.
- Hosting: GitHub Pages (alleen statische bestanden, geen backend).
- API-sleutels staan nooit in de repo. Gebruik een config die in .gitignore staat.

## Commando's
- Lokaal draaien: `npx serve .` (open op localhost)
- Tests: `npm test` (Vitest, alleen voor pure logica zoals het fairness-algoritme)
- Lint: `npm run lint`

## Werkwijze
1. Eerst plannen, dan bouwen. Bij elke nieuwe milestone: korte plan, wacht op mijn akkoord.
2. Bouw in verticale stukjes: elk stuk werkt end-to-end in de browser voordat je verdergaat.
3. Verifieer zelf: draai tests en start de app. Zeg alleen "klaar" als je het hebt gecontroleerd en laat zien wat je hebt gecontroleerd.
4. Kleine commits per werkend stuk, met duidelijke Engelse berichten.
5. Houd bestanden klein (richtlijn: onder 300 regels). Eén module, één verantwoordelijkheid.

## Stoppen en vragen
- Stop en vraag het mij als: een keuze in de spec tegenstrijdig is, een feature een backend nodig blijkt te hebben, of je een nieuwe dependency wilt toevoegen.
- Bouw niets uit de lijst "Buiten scope" tenzij ik het expliciet vraag.
- Ga niet door naar de volgende milestone zonder mijn akkoord.

## Buiten scope (nog niet bouwen)
TensorFlow.js, WebXR, Web Audio, Stripe/paywall, Plausible, Quantum Entanglement, Chrono-Conflict, Dimensional Portal, Emotive Avatars, Social Reputation Aura, Atmospheric Mood, Temporal Echo.

## Ontwerp
Donker futuristisch thema, glas-morphism, neon cyaan (#00F0FF) / magenta (#FF00E6) / paars (#8B00FF), achtergrond #0A0E27. Fonts: Rajdhani (koppen), Inter (tekst), Space Mono (data). Alle kleuren als CSS-variabelen in één bestand.
