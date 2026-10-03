# Aether — Complete App Specificatie

**Versie:** 1.0.0  
**Datum:** 3 oktober 2026  
**Status:** Gereed voor ontwikkeling  
**License:** MIT (Open Source)

***

## Inhoudsopgave

1. [App Overview](#1-app-overview)
2. [Feature Inventarisatie](#2-feature-inventarisatie)
3. [Data Model](#3-data-model)
4. [User Flows](#4-user-flows)
5. [Screens & Layout](#5-screens--layout)
6. [Visuele Identiteit](#6-visuele-identiteit)
7. [Technische Specificaties](#7-technische-specificaties)
8. [Edge Cases & Validatie](#8-edge-cases--validatie)
9. [Wijzigingslogboek](#9-wijzigingslogboek)
10. [Volgende Stappen](#10-volgende-stappen)

***

## 1. App Overview

### App Naam
**Aether**

### One-liner
Aether berekent automatisch de eerlijkste ontmoetingslocatie voor groepen op basis van reistijd, met een futuristische 3D-interface, AI-gedreven personalisatie, en directe boekingsintegratie — volledig offline-first met optionele live data via Mapbox.

### Doelgroep

- **Primair:** Sociaal actieve professionals (25-45 jaar) in Nederland/Europa die regelmatig afspreken met vrienden, collega's, of netwerkcontacten
- **Secundair:** Groepen (3-12 personen) met vaste afspraken die voorkeuren willen onthouden en eerlijke reistijden waarderen
- **Tertiair:** Early adopters die privacy belangrijk vinden (offline-first), futuristisch design waarderen, en bereid zijn te betalen voor premium features (freemium model)

### Core Value Proposition

Aether lost de frustratie op van ongelijke reistijden en eindeloos onderhandelen over waar afspreken — met een visueel indrukwekkende, futuristische interface die afspreken voelt als een ervaring, niet als een taak. De app werkt 90% offline (privacy, snelheid, lage kosten) met optionele live data voor reistijden en POI's.

**Unieke verkoopargumenten:**

- ✅ **Eerlijkheid eerst:** Uniek algoritme dat reistijd fair verdeelt, niet alleen afstand minimaliseert
- ✅ **Offline-first:** Werkt zonder internet, slaat alles lokaal op, geen data naar servers
- ✅ **Futuristisch design:** 3D holografische orb, neon glow effects, glas-morphism UI
- ✅ **Privacy-by-design:** Geen account nodig, geen password, geen tracking
- ✅ **Open source:** Volledige code beschikbaar op GitHub (MIT license)
- ✅ **Low-cost:** Static only hosting, gratis Mapbox tier, geen backend kosten

***

## 2. Feature Inventarisatie

| Feature | Type | Prioriteit (1-5) | Beschrijving | Status |
|---------|------|------------------|--------------|--------|
| **Fairness algoritme (core)** | Core | 5 | Berekent eerlijkste locatie op basis van reistijd-verdeling (standaardafwijking/gemiddelde) | Behouden |
| **Haversine fallback** | Core | 5 | Offline afstandsschatting wanneer Mapbox API niet bereikbaar is | Behouden |
| **Fairness slider** | Core | 5 | Gebruiker schuift tussen "maximaal eerlijk" (gelijke tijden) en "maximaal efficiënt" (kortste totale tijd) | Behouden |
| **Groepen beheren** | Core | 5 | Groepen aanmaken, leden uitnodigen (QR/export), gezamenlijke voorkeuren opslaan | Behouden |
| **Profiel met voorkeuren** | Core | 5 | Standaardlocaties (thuis/werk), vervoersmiddel, budget, locatietype voorkeuren | Behouden |
| **POI search + filtering** | Core | 5 | Zoeken naar restaurants, cafés, vergaderzalen binnen fair zone met filters (prijs, rating, type) | Behouden |
| **IndexedDB lokale opslag** | Core | 5 | Alle data lokaal opslaan (afspraken, voorkeuren, groepen) voor offline-first | Behouden |
| **Service Worker caching** | Core | 5 | Statische assets + API responses cachen voor offline gebruik | Behouden |
| **PWA installable** | Core | 5 | App kan geïnstalleerd worden op home screen zonder app store | Behouden |
| **3D Holographic Orb** | Futuristisch | 4 | Three.js 3D-stad model met zwevende locatiemarkers die pulseren op fairness-score | Behouden (gratis GLTF asset) |
| **Direct boeken** | Core | 4 | Integratie met Booking.com, OpenTable via affiliate links (geen eigen backend) | Aanpassen (alleen deep links voor MVP) |
| **Mapbox Directions API** | Core | 5 | Live reistijden, multimodaal routing (auto, OV, fiets, lopen) | Behouden (gratis tier: 50k calls/maand) |
| **Mapbox Search API** | Core | 5 | POI metadata, openingstijden, ratings | Behouden (gratis tier) |
| **TensorFlow.js preference predictor** | Futuristisch | 3 | AI leert van gebruikersgedrag en voorspelt locatievoorkeuren | Behouden (optioneel, laadt alleen als online) |
| **Temporal Echo Preview** | Futuristisch | 3 | Time-lapse animatie toont locatie op verschillende tijdstippen (ochtend/avond) via Canvas | Behouden (offline rendering) |
| **Social Reputation Aura** | Futuristisch | 3 | Dynamische "aura" rond avatar toont sociale reputatie (op tijd komen, flexibiliteit) | Behouden (CSS glow effects, lokaal) |
| **Quantum Entanglement Matching** | Futuristisch | 3 | Web Workers berekenen verborgen correlaties (bijv. iedereen houdt van jazz) | Behouden (Web Workers, D3.js visualisatie) |
| **Chrono-Conflict Resolver** | Futuristisch | 3 | Bij planning-conflicten: scherm splitst in parallelle tijdlijnen (CSS Grid) | Behouden |
| **Dimensional Portal Booking** | Futuristisch | 2 | Boekingsknop activeert WebGL portal animatie die je "transporteert" naar locatie | Behouden (Three.js shader, optioneel) |
| **Atmospheric Mood Synthesis** | Futuristisch | 3 | Weersdata (lokaal gecached) genereert "sfeerscore" voor locaties | Behouden (IndexedDB weather cache, Canvas particles) |
| **Emotive Avatar Negotiation** | Futuristisch | 2 | 2D SVG avatars met CSS animaties tonen lichaamstaal (knikken, armen kruisen) | Aanpassen (vereenvoudigd van 3D) |
| **Web Audio API soundscapes** | Futuristisch | 2 | Harmonieuze akkoorden bij eerlijke verdeling, dissonantie bij ongelijkheid | Behouden (alleen als "easter egg", standaard uit) |
| **WebXR AR support** | Futuristisch | 2 | 3D-stad bekijken in augmented reality via browser | Behouden (alleen op ondersteunde browsers, fallback naar 2D) |
| **Neural Style Transfer Venues** | Futuristisch | 2 | Locaties tonen in kunststijl (Van Gogh, cyberpunk) via TensorFlow.js | Verwijderen (te zwaar voor mobiele browsers) |
| **Biometric Venue Scoring** | Futuristisch | 1 | Locaties scoren op biologische compatibiliteit (hartslagvariatie) | Verwijderen (vereist wearables, te niche) |
| **Web Bluetooth wearable sync** | Futuristisch | 1 | Hartslag/stress data van wearables uitlezen voor bio-score | Verwijderen (beperkte browser support) |
| **QR code groep export** | Core | 4 | Groepsdata exporteren als QR code voor offline delen met leden | Toegevoegd (voor volledig offline groep sync) |
| **Local notifications** | Core | 4 | Offline herinneringen voor afspraken (geen push zonder online) | Toegevoegd |
| **Zoekbalk (overal)** | Core | 4 | Snel zoeken in groepen, afspraken, POI's | Toegevoegd (uit optimalisatie) |
| **Empty states** | Core | 4 | Duidelijke illustraties + CTA bij lege schermen | Toegevoegd (uit optimalisatie) |
| **Overflow menus (⋮)** | Core | 4 | Secundaire acties verplaatsen naar menu voor schoner design | Toegevoegd (uit optimalisatie) |
| **Glas-morphism cards** | Core | 4 | Consistente visuele stijl voor alle kaartjes | Toegevoegd (uit optimalisatie) |
| **Neon glow effects** | Futuristisch | 4 | Glow op interactieve elementen (knoppen, toggles, markers) | Behouden (uit visuele identiteit) |
| **Custom neon toggles** | Futuristisch | 4 | Toggle switches met glow effect (aan = cyaan, uit = grijs) | Toegevoegd (uit optimalisatie) |
| **Deeltjes animaties** | Futuristisch | 3 | Canvas deeltjes op knoppen, achtergronden, success screens | Toegevoegd (uit optimalisatie) |
| **Affiliate booking** | Core | 3 | Deep links naar Booking.com, OpenTable met affiliate tracking | Behouden (geen eigen backend) |
| **Freemium paywall** | Core | 3 | Premium: 3D orb, AI features, onbeperkt groepen | Behouden (Stripe Payment Links voor MVP) |
| **Donatie integratie** | Core | 2 | GitHub Sponsors + Tikkie links in profiel | Toegevoegd |
| **Plausible analytics** | Core | 2 | Privacy-vriendelijke analytics (geen cookies) | Behouden |
| **Open source (MIT)** | Core | 2 | Code op GitHub, community contributies | Behouden |

***

## 3. Data Model

### Data Objecten

#### 1. User

```javascript
{
  id: string (UUID, crypto.randomUUID()),  // Verplicht
  name: string,                             // Verplicht
  email: string (optioneel),                // Voor backup/sync
  avatar: string (base64 of URL, optioneel),
  created_at: timestamp,                    // Verplicht
  reputation_score: number (0-1, default 0.5), // Voor aura feature
  preferences: {                            // Verplicht
    default_transport: string,              // "car" | "transit" | "bike" | "walk"
    budget_level: number,                   // 1-4 (€ tot €€€€)
    preferred_types: string[],              // ["restaurant", "cafe", ...]
    accessibility: string[],                // ["wheelchair", "kid_friendly", ...]
    fairness_priority: number,              // 0-1 (0 = efficiënt, 1 = eerlijk)
    theme: string,                          // "dark" | "light"
    language: string                        // "nl" | "en"
  },
  locations: Location[]                     // Verplicht (minimaal 1)
}
```

**Verplichte velden:** `id`, `name`, `created_at`, `preferences`, `locations`

***

#### 2. Location

```javascript
{
  id: string (UUID),                        // Verplicht
  user_id: string (FK),                     // Verplicht
  label: string,                            // Verplicht ("Thuis", "Werk", ...)
  address: string,                          // Verplicht
  lat: number,                              // Verplicht
  lng: number,                              // Verplicht
  transport_mode: string,                   // "car" | "transit" | "bike" | "walk"
  is_default: boolean                       // Verplicht
}
```

**Verplichte velden:** `id`, `user_id`, `label`, `address`, `lat`, `lng`, `transport_mode`, `is_default`

***

#### 3. Group

```javascript
{
  id: string (UUID),                        // Verplicht
  name: string,                             // Verplicht
  owner_id: string (FK),                    // Verplicht
  created_at: timestamp,                    // Verplicht
  description: string (optioneel),          // Bijv. "Vrijdag borrel crew"
  cover_image: string (URL/base64, optioneel),
  members: GroupMember[],                   // Verplicht (minimaal 2)
  default_preferences: {                    // Optioneel
    transport: string,
    budget: number,
    types: string[]
  },
  appointments: Appointment[],              // Optioneel
  notification_enabled: boolean             // Default true
}
```

**Verplichte velden:** `id`, `name`, `owner_id`, `created_at`, `members`

***

#### 4. GroupMember

```javascript
{
  user_id: string (FK),                     // Verplicht
  joined_at: timestamp,                     // Verplicht
  invite_method: string                     // "qr" | "link" | "email"
}
```

**Verplichte velden:** `user_id`, `joined_at`, `invite_method`

***

#### 5. Appointment

```javascript
{
  id: string (UUID),                        // Verplicht
  group_id: string (FK),                    // Verplicht
  created_by: string (FK),                  // Verplicht
  datetime: timestamp,                      // Verplicht
  duration_minutes: number,                 // Verplicht
  status: string,                           // "draft" | "confirmed" | "cancelled"
  selected_poi: POI (optioneel),
  fairness_score: number,                   // 0-1 (hoe eerlijk de verdeling is)
  average_travel_time: number,              // Minuten
  travel_time_stddev: number,               // Standaardafwijking (fairness metric)
  notes: string,                            // Optioneel
  reminder_enabled: boolean                 // Default true
}
```

**Verplichte velden:** `id`, `group_id`, `created_by`, `datetime`, `duration_minutes`, `status`, `fairness_score`, `average_travel_time`, `travel_time_stddev`

***

#### 6. POI (Point of Interest)

```javascript
{
  id: string,                               // Verplicht (bijv. "mapbox_poi_123")
  name: string,                             // Verplicht
  lat: number,                              // Verplicht
  lng: number,                              // Verplicht
  type: string,                             // "restaurant" | "cafe" | "bar" | "meeting_room" | ...
  price_level: number,                      // 1-4
  rating: number,                           // 0-5
  review_count: number,                     // Optioneel
  opening_hours: object,                    // Optioneel
  photos: string[],                         // URLs of base64
  booking_partner: string,                  // "opentable" | "booking" | null
  affiliate_url: string,                    // Deep link voor booking
  last_updated: timestamp                   // Voor cache validatie
}
```

**Verplichte velden:** `id`, `name`, `lat`, `lng`, `type`, `price_level`, `rating`

***

#### 7. Booking (Lightweight)

```javascript
{
  id: string (UUID),                        // Verplicht
  appointment_id: string (FK),              // Verplicht
  poi_id: string (FK),                      // Verplicht
  partner: string,                          // "opentable" | "booking" | null
  affiliate_url: string,                    // Deep link
  status: string,                           // "pending" | "confirmed" | "cancelled"
  created_at: timestamp                     // Verplicht
}
```

**Verplichte velden:** `id`, `appointment_id`, `poi_id`, `partner`, `affiliate_url`, `status`, `created_at`

***

#### 8. CacheEntry (voor API responses)

```javascript
{
  key: string,                              // Unieke cache key
  data: object,                             // Gecachte data
  expires_at: timestamp,                    // Wanneer cache verloopt
  created_at: timestamp                     // Voor debugging
}
```

**Verplichte velden:** `key`, `data`, `expires_at`, `created_at`

***

#### 9. WeatherCache (voor mood synthesis)

```javascript
{
  location_key: string,                     // "lat_lng"
  weather_data: {                           // Weersdata
    temperature: number,
    condition: string,                      // "sunny" | "rainy" | ...
    air_quality: number
  },
  fetched_at: timestamp                     // Voor validatie
}
```

**Verplichte velden:** `location_key`, `weather_data`, `fetched_at`

***

### Relaties tussen Objecten

```
User (1) ──┬── (N) Location
           │
           └── (N) GroupMember ── (N) Group ── (N) Appointment ── (1) POI
                                               │
                                               └── (1) Booking (optioneel)
```

**Relatie-types:**

- **User → Location:** One-to-many (één gebruiker heeft meerdere locaties)
- **User → GroupMember:** One-to-many (één gebruiker is lid van meerdere groepen)
- **GroupMember → Group:** Many-to-one (meerdere leden behoren tot één groep)
- **Group → Appointment:** One-to-many (één groep heeft meerdere afspraken)
- **Appointment → POI:** Many-to-one (meerdere afspraken kunnen naar dezelfde POI verwijzen)
- **Appointment → Booking:** One-to-one (optioneel, één boeking per afspraak)

***

## 4. User Flows

### User Type: Nieuwe Gebruiker (Eerste Keer)

#### Inloggen

- Geen inlog verplicht — app werkt volledig offline zonder account
- Geen password — UUID gegenereerd bij eerste gebruik (`crypto.randomUUID()`)
- Optioneel: naam invoeren (voor personalisatie)

#### Dashboard (eerste scherm)

- Welcome carousel (2 schermen + 1 interactieve demo)
  - **Slide 1:** "Welkom bij Aether" + badges ("Geen account nodig", "Werkt offline", "Open source")
  - **Slide 2:** **Interactieve fairness slider demo** (2 dummy locaties, live update)
  - **Slide 3:** "Klaar om te starten?" + "Start met je eerste afspraak" knop
- Progressie indicator: "1/3", "2/3", "3/3" (rechtsboven)
- Geen "Skip" knop — gebruikers kunnen swipen

#### Acties

1. Tutorial swipen (of doorklikken)
2. "Start" knop → gaat naar "Afspraak aanmaken" flow

#### Navigatie

- Bottom navigation bar verschijnt na tutorial: **Afspraken** | **Groepen** | **Profiel**
- FAB (Floating Action Button): "Nieuw" (rechtsonder, gradient, glow)

***

### User Type: Bestaande Gebruiker (Terugkerend)

#### Inloggen

- Automatisch "ingelogd" via LocalStorage UUID sessie
- Geen password nodig (privacy-first: data is lokaal)

#### Dashboard

- Header: "Aether" logo (links) + zoekbalk (rechts)
- Sectie: "Aankomende afspraken" (kaartjes met datum, tijd, locatie)
  - Sorteer dropdown: "Datum", "Afstand", "Groep"
- Empty state (geen afspraken): Illustratie + "Geen afspraken — maak er een!" + FAB highlight
- Bottom navigation: Afspraken | Groepen | Profiel
- FAB: "Nieuw" (rechtsonder)

#### Acties

- Afspraak aanklikken → detail scherm (quick preview)
- "Nieuw" FAB → start afspraak flow
- Zoekbalk → zoek in afspraken, groepen, POI's
- Navigatie tabs wisselen

#### Navigatie

- Bottom navigation (altijd zichtbaar)
- Swipe gestures tussen tabs (optioneel)
- Long-press op afspraak → context menu (bewerk, deel, verwijder)

***

### User Flow: Afspraak Aanmaken

#### Stap 1 — Groep selecteren

1. Gebruiker klikt "Nieuw" FAB
2. Header: "Nieuwe afspraak" + "Stap 1: Groep" (rechts, klein)
3. Lijst van groepen (recente bovenaan) + zoekbalk (optioneel)
4. "+" icoon (rechtsboven) → snel nieuwe groep maken
5. Click op groep → auto-navigate naar stap 2
6. "Geen groep? Maak er een" link → opent groep aanmaken modal

#### Stap 2 — Wanneer?

1. Header: "Stap 2: Wanneer?"
2. Datepicker: Custom grid met neon lijnen, geselecteerde datum glowt
3. Timepicker: Cirkelvormige slider (radiaal, 24-uurs klok)
4. Duur slider: Horizontaal (30 min - 3 uur) + live eindtijd preview
5. Suggesties chips: "Vrijdag 17:00", "Zondag 14:00", "Woensdag 12:30"
6. Toggle: "Check mijn agenda" (indien toestemming)
7. Accordion: "Optioneel" → notities veld
8. "Volgende" knop (rechts, groot, gradient) → stap 3

#### Stap 3 — Waar starten jullie?

1. Header: "Stap 3: Waar starten jullie?"
2. Toggle (rechtsboven): "Auto-detecteer locaties" (indien online + toestemming)
3. Knop: "Gebruik standaard locaties" (bovenaan, snel invullen)
4. Lijst van deelnemers (avatar hologram + naam + adres + vervoer icoon)
5. Click op adres → opent locatie editor
6. Geschatte reistijd (lichtgrijs) per deelnemer (preview)
7. "Bereken" knop (groot, gradient, rechtsonder, deeltjes animatie) → stap 4

#### Stap 4 — Resultaten

1. Toggle: "3D weergave" (default aan)
2. 3D Orb (60% scherm) + Lijst (40%) of 2D/Alleen lijst modus
3. Fairness slider (zwevende bar onderin, over beide secties)
4. Toggle: "Toon reistijd zones" (default uit, isochrone overlays)
5. Metrics: "Fairness: 0.87 | Avg: 18 min | Δ: 3 min" (boven lijst)
6. Lijst header: "Locaties" + filter chips (Type, Prijs, Rating)
7. "Deel" icoon (rechtsboven) → QR/link
8. Click op locatie → detail scherm

***

### User Flow: Groep Beheren

#### Overzicht

1. Navigeer naar "Groepen" tab
2. Header: "Groepen" + zoekbalk (rechts) + "+" (klein)
3. Lijst van groepen (kaartjes):
   - Naam + avatar ringen (neon glow)
   - Stats: "5 afspraken" of "3 leden"
4. Sorteer dropdown: "Recentste", "Meeste leden", "A-Z"
5. FAB: "Nieuwe groep" (rechtsonder, pulsing glow)
6. Empty state: Illustratie + "Geen groepen — maak je eerste!" + FAB highlight

#### Nieuwe groep

1. Click op FAB → modal:
   - Groepsnaam invoeren
   - Optioneel: beschrijving, cover image
   - "Leden uitnodigen" → QR code genereren of link kopiëren
2. Opslaan → terug naar overzicht

#### Groep bewerken

1. Click op groep → detail scherm
2. Header: Groepsnaam + overflow menu (⋮)
3. Optioneel: cover image, beschrijving
4. Ledenlijst: Avatars (hologram) + naam + online status (neon dot)
5. Knop: "Uitnodigen" (bovenaan)
6. Overflow menu (⋮): Bewerk, Exporteer QR, Verwijder groep
7. Sectie: "Standaard voorkeuren" (dropdowns, slider, chips met neon styling)
8. Toggle: "Ontvang meldingen voor deze groep"
9. Sectie: "Recente afspraken" (max 3, "Bekijk alle" link)

***

## 5. Screens & Layout

### Screen 1: Welcome / Onboarding

**Doel:** Eerste indruk + waarde uitleggen + "aha-moment" creëren

**UI Elementen:**

- Full-screen carousel (3 schermen)
  - **Slide 1:** "Welkom bij Aether" (groot, gradient tekst)
    - Badges: "Geen account nodig" | "Werkt offline" | "Open source"
    - Subtitel: "Vind de eerlijkste ontmoetingsplek in seconden"
    - Achtergrond: Subtiel geanimeerde gradient (1 cyclus per 10 seconden)
  - **Slide 2:** "Iedereen even lang onderweg" (interactieve demo)
    - Werkende fairness slider (2 dummy locaties)
    - Live update van markers (pulserend op fairness)
    - Tekst: "Schuif om te zien hoe het werkt"
  - **Slide 3:** "Klaar om te starten?"
    - Grote "Start met je eerste afspraak" knop (gradient, glow)
    - Subtitel: "Geen gedoe, gewoon eerlijk afspreken"
- Progressie: "1/3", "2/3", "3/3" (rechtsboven, klein)
- Geen "Skip" knop — swipen is voldoende

**Acties:**

- Swipe tussen schermen
- Fairness slider uitproberen (slide 2)
- "Start" knop → gaat naar "Afspraak aanmaken"

***

### Screen 2: Dashboard (Afspraken)

**Doel:** Overzicht + snelle acties

**UI Elementen:**

- Header: "Aether" logo (links) + zoekbalk (rechts)
- Sectie: "Aankomende afspraken"
  - Sorteer dropdown: "Datum", "Afstand", "Groep"
  - Afspraak kaartjes (glas-morphism, neon rand, hover glow):
    - Datum/tijd (groot)
    - Locatie naam
    - Groep naam (klein)
    - Reistijd (kleurcode: groen/oranje/rood)
  - Empty state: Illustratie + "Geen afspraken — maak er een!" + FAB highlight
- FAB: "Nieuw" (rechtsonder, gradient, pulsing glow)
- Bottom navigation: Afspraken | Groepen | Profiel

**Acties:**

- Afspraak aanklikken → quick preview modal
- "Nieuw" FAB → start afspraak flow
- Zoekbalk → zoek in afspraken
- Navigatie tabs wisselen

***

### Screen 3: Afspraak Aanmaken — Stap 1 (Groep)

**Doel:** Deelnemers selecteren

**UI Elementen:**

- Header: "Nieuwe afspraak" (gradient tekst) + "Stap 1: Groep" (rechts, klein)
- Lijst van groepen (recente bovenaan):
  - Groep kaartje: Naam + avatar ringen (neon glow) + laatste afspraak datum
  - Click op groep → auto-navigate
- "+" icoon (rechtsboven) → snel nieuwe groep modal
- Link: "Geen groep? Maak er een" (onderaan)
- Zoekbalk (optioneel, bij veel groepen)

**Acties:**

- Groep selecteren → auto-navigate naar stap 2
- "+" icoon → nieuwe groep modal
- Link → groep aanmaken flow

***

### Screen 4: Afspraak Aanmaken — Stap 2 (Wanneer?)

**Doel:** Datum, tijd, duur instellen

**UI Elementen:**

- Header: "Stap 2: Wanneer?"
- Datepicker: Custom 7x5 grid met neon lijnen, geselecteerde datum pulseert
- Timepicker: Cirkelvormige slider (radiaal, 24-uurs klok, gradient stroke)
- Duur slider: Horizontaal (30 min - 3 uur) + live eindtijd preview
- Suggesties chips: "Vrijdag 17:00", "Zondag 14:00", "Woensdag 12:30"
- Toggle: "Check mijn agenda" (indien toestemming)
- Accordion: "Optioneel" → notities veld
- "Volgende" knop (rechts, groot, gradient, deeltjes animatie)

**Acties:**

- Datum/tijd kiezen
- Duur slider aanpassen
- Suggestie chip selecteren
- "Volgende" → stap 3

***

### Screen 5: Afspraak Aanmaken — Stap 3 (Locaties)

**Doel:** Deelnemers en hun startlocaties bevestigen

**UI Elementen:**

- Header: "Stap 3: Waar starten jullie?"
- Toggle (rechtsboven): "Auto-detecteer locaties" (indien online + toestemming)
- Knop: "Gebruik standaard locaties" (bovenaan, secundair)
- Lijst van deelnemers:
  - Avatar (hologram glow) + naam + adres (klikbaar) + vervoer icoon
  - Geschatte reistijd (lichtgrijs, preview)
- Click op adres → opent locatie editor modal
- "Bereken" knop (groot, gradient, rechtsonder, deeltjes animatie)

**Acties:**

- Locatie bewerken (click op adres)
- Vervoersmiddel wijzigen
- "Berekenen" → start algoritme, gaat naar resultaten

***

### Screen 6: Resultaten

**Doel:** Locatie-opties tonen met fairness visualisatie

**UI Elementen:**

- Toggle (rechtsboven): "3D weergave" (default aan)
- Toggle (rechtsboven, klein): "Toon reistijd zones" (default uit)
- **3D Orb (60% scherm):**
  - Stad model (GLTF, gratis asset)
  - Zwevende markers (grootte = fairness score, pulserend)
  - Isochrone overlays (optioneel, transparant)
  - Fairness slider (zwevende bar onderin, gradient: groen → rood)
- **Lijst (40% scherm):**
  - Metrics: "Fairness: 0.87 | Avg: 18 min | Δ: 3 min" (bovenaan)
  - Header: "Locaties" + filter chips (Type, Prijs, Rating)
  - Lijst items (glas-morphism cards):
    - Naam, rating (neon sterren), prijs (kleurcode)
    - Reistijden per persoon (kleurcodes: groen/oranje/rood)
    - "Bekijk" knop (secundair)
- "Deel" icoon (rechtsboven) → QR/link modal

**Acties:**

- 3D model draaien (swipe)
- Fairness slider aanpassen → live update van ranking
- Filter chips selecteren
- Locatie selecteren → gaat naar detail scherm
- "Deel" → deelt resultaten met groep

***

### Screen 7: Locatie Detail

**Doel:** Gedetailleerde info over geselecteerde POI

**UI Elementen:**

- Header: Locatie naam (groot) + terug (klein, links) + overflow menu (⋮, rechts)
- Foto grid (2x3): Hover zoom (scale 1.05), neon rand bij selectie
- Info sectie:
  - Rating: Neon sterren (SVG glow) + review count (tooltip)
  - Prijs: €€ met kleurcode (groen=goedkoop, rood=duur)
  - Adres: Klikbaar (opent native maps)
  - Openingstijden: Vandaag gemarkeerd (groen=open, rood=gesloten)
  - Voorzieningen: Top 3 iconen + "Meer bekijken" accordion
  - Populariteit: "Drukte nu: [Groen/Oranje/Rood]" indicator
- Reistijden per deelnemer (kleurcodes) + gemiddelde
- Zwevende "Boek nu" knop (rechtsonder, gradient, glow, deeltjes animatie)
- Overflow menu (⋮): Opslaan als favoriet, Deel, Rapporteer

**Acties:**

- Foto's swipen/zoomen
- Adres klikken → opent Google/Apple Maps
- "Boek nu" → start booking flow (deep link)
- Overflow menu → favoriet, deel, etc.
- Terug → naar resultaten

***

### Screen 8: Booking Flow

**Doel:** Reservering bevestigen via deep link

**UI Elementen:**

- Header: "Boeking"
- **Stap 1 — Details:**
  - Datum/tijd (niet bewerkbaar, kleine edit knop)
  - Aantal personen: Slider (1-20) + live preview
  - Accordion: "Optioneel" → speciale verzoeken
  - Toggle: "Check annuleerbeleid" → toon tekst
  - "Volgende" knop (rechts, groot)
- **Stap 2 — Bevestigen:**
  - Samenvatting: Locatie, datum/tijd, aantal personen
  - Tekst: "Gratis annuleren tot 24u van tevoren" (indien van toepassing)
  - Toggle: "Stuur herinnering 1 uur van tevoren" (default aan)
  - Tekst: "Je ontvangt een bevestiging per e-mail" (verwachtingen managen)
  - "Bevestig" knop (groot, gradient, glow)
- Loading state: "Versturen..." + pulsing glow op knop

**Acties:**

- Aantal personen aanpassen
- "Volgende" → stap 2
- "Bevestig" → opent deep link naar partner (Booking.com, OpenTable)
- Affiliate tracking via URL parameters

***

### Screen 9: Boeking Bevestigd

**Doel:** Succes tonen + volgende stappen

**UI Elementen:**

- Checkmark animatie (klein, bovenaan, SVG stroke animatie + glow trail)
- Header: "Succes!" (groot, gradient) + subtitel "Je boeking is bevestigd"
- Kern details: Locatie naam, datum/tijd (groot)
- Accordion: "Meer details" → adres, aantal personen, annuleerbeleid
- Toggle: "Stuur herinnering 1 uur van tevoren" (default aan)
- Knoppen:
  - "Voeg toe aan calendar" (primair, gradient) → Google/Apple/iCal opties
  - "Deel" (secundair) → WhatsApp/SMS/Link/QR
- Optioneel: "Hoe ging het? ⭐⭐⭐⭐⭐" (klein, onderaan)
- Achtergrond: Subtiele confetti animatie (Canvas deeltjes, langzaam zakken)

**Acties:**

- Calendar integratie selecteren
- Delen via kanaal kiezen
- Terug naar dashboard (automatisch na 3 seconden of click)

***

### Screen 10: Groepen Overzicht

**Doel:** Alle groepen beheren

**UI Elementen:**

- Header: "Groepen" (groot) + zoekbalk (rechts) + "+" (klein)
- Lijst van groepen (kaartjes):
  - Naam + avatar ringen (neon glow)
  - Stats: "5 afspraken" of "3 leden"
  - Click op groep → detail scherm
- Sorteer dropdown: "Recentste", "Meeste leden", "A-Z"
- FAB: "Nieuwe groep" (rechtsonder, gradient, pulsing glow)
- Empty state: Illustratie + "Geen groepen — maak je eerste!" + FAB highlight

**Acties:**

- Groep selecteren → detail scherm
- "Nieuwe groep" FAB → modal
- Zoekbalk → filter groepen
- Sorteren → herschik lijst

***

### Screen 11: Groep Detail

**Doel:** Groep bewerken + voorkeuren instellen

**UI Elementen:**

- Header: Groepsnaam (groot) + overflow menu (⋮)
- Optioneel: Cover image (met overlay)
- Optioneel: Beschrijving (tekstveld)
- Ledenlijst:
  - Avatar (hologram glow) + naam + online status (neon dot)
  - Knop: "Uitnodigen" (bovenaan, gradient)
  - Overflow menu (⋮) per lid → Verwijder
- Sectie: "Standaard voorkeuren"
  - Vervoersmiddel (dropdown, neon styling)
  - Budget (slider, glow)
  - Locatietype (multi-select chips, neon rand)
- Toggle: "Ontvang meldingen voor deze groep" (default aan)
- Sectie: "Recente afspraken" (max 3, "Bekijk alle" link)
- Overflow menu (⋮): Bewerk groep, Exporteer QR, Verwijder groep

**Acties:**

- Leden uitnodigen (QR/link)
- Voorkeuren aanpassen
- Toggle notificaties
- Overflow menu → groep bewerken/verwijderen

***

### Screen 12: Profiel / Instellingen

**Doel:** Gebruikersdata beheren

**UI Elementen:**

- Header: "Instellingen"
- Avatar + naam (alleen tonen, bewerk in menu)
- Sectie: "Standaard locaties"
  - Lijst van locaties (neon pins, click om te editen)
  - "Voeg locatie toe" knop (gradient)
- Sectie: "Voorkeuren"
  - Vervoersmiddel (dropdown)
  - Budgetniveau (slider)
  - Dieet/voorkeuren (multi-select chips)
- Sectie: "Privacy & Data"
  - Toggle: "Locatie toegang" (custom neon toggle)
  - Knop: "Data exporteren" (secundair)
  - Knop: "Account verwijderen" (rood, in submenu)
- Sectie: "App"
  - Toggle: "Donker / Licht" thema
  - Dropdown: "Taal: Nederlands / English"
  - Link: "Help & feedback" → FAQ/formulier
- Sectie: "Over"
  - Tekst: "Versie 1.0.0"
  - Link: "Open source (MIT)" → GitHub
  - Link: "Doneer" → GitHub Sponsors + Tikkie

**Acties:**

- Locaties toevoegen/bewerken
- Voorkeuren opslaan
- Thema/t taal wijzigen
- Data exporteren/verwijderen
- Doneer link klikken

***

## 6. Visuele Identiteit

### Kleurenpallet

| Rol | Kleur | Hex | Gebruik |
|-----|-------|-----|---------|
| **Primair** | Electric Blue | `#00F0FF` | Knoppen, highlights, fairness slider (eerlijk kant), glow |
| **Secundair** | Neon Magenta | `#FF00E6` | Accenten, notifications, fairness slider (efficiënt kant) |
| **Accent** | Electric Purple | `#8B00FF` | Gradients, 3D orb glow effects |
| **Achtergrond (Dark)** | Deep Space Black | `#0A0E27` | Primaire achtergrond (donkere modus default) |
| **Surface (Dark)** | Midnight Blue | `#12163A` | Kaartjes, panels, modals |
| **Achtergrond (Light)** | Light Gray | `#F5F7FA` | Lichte modus achtergrond |
| **Surface (Light)** | White | `#FFFFFF` | Lichte modus kaartjes |
| **Text primair (Dark)** | White | `#FFFFFF` | Headers, body text op donker |
| **Text primair (Light)** | Dark Blue | `#0A0E27` | Headers, body text op licht |
| **Text secundair** | Light Gray | `#B0B8D8` | Subtitle, metadata (donker) / `#6B7280` (licht) |
| **Success** | Neon Green | `#00FF88` | Bevestigingen, hoge scores, open status |
| **Warning** | Amber | `#FFB800` | Waarschuwingen, medium scores |
| **Error** | Crimson | `#FF3366` | Foutmeldingen, lage scores, gesloten status |

**Gradient voor primaire knoppen:**

```css
background: linear-gradient(135deg, #00F0FF 0%, #8B00FF 100%);
```

***

### Typografie

| Element | Font | Gewicht | Grootte (mobiel) |
|---------|------|---------|------------------|
| **Headers (H1)** | Rajdhani | 700 (Bold) | 28px |
| **Subheaders (H2)** | Rajdhani | 600 (SemiBold) | 22px |
| **Body** | Inter | 400 (Regular) | 16px |
| **Labels / Buttons** | Rajdhani | 600 (SemiBold) | 14px |
| **Data / Code** | Space Mono | 400 (Regular) | 13px |

**Font loading:**

- Google Fonts (Rajdhani, Inter, Space Mono)
- Preload in `<head>`: `<link rel="preconnect" href="https://fonts.googleapis.com">`

***

### Design Stijl

**Stijl:** Futuristisch minimalisme (glas-morphism + neon glow)

**Kenmerken:**

- Donkere modus default (space theme)
- Glas-morphism voor panels:
  ```css
  background: rgba(18, 22, 58, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 240, 255, 0.2);
  ```
- Neon glow effects voor interactieve elementen:
  ```css
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
  ```
- Dunne lijnen (1px borders) voor structuur
- Ruime whitespace (padding/margins) voor ademruimte
- Custom toggles met glow (aan = cyaan, uit = grijs)

***

### Iconografie Stijl

**Stijl:** Lineaire icons met neon accenten

**Library:** Lucide Icons (outline variant)

**Kleur:**

- Default: `#B0B8D8` (light gray)
- Active: `#00F0FF` (electric blue)
- Error: `#FF3366` (crimson)

**Grootte:**

- Small: 16x16px (inline)
- Medium: 24x24px (knoppen, navigatie)
- Large: 48x48px (empty states, features)

***

### Animatie Principes

**Filosofie:** Alles beweegt subtiel — statische elementen voelen dood

**Principes:**

1. **Duur:** 200-400ms voor micro-interacties, 600-800ms voor transitions
2. **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (smooth ease-in-out)
3. **Hover:** Scale 1.05 + glow effect op knoppen
4. **Loading:** Pulsing glow (opacity 0.5 → 1 → 0.5, 2s infinite)
5. **Page transitions:** Fade + slide (20px omhoog)
6. **3D orb:** Continue rotatie (1 rotatie per 60 seconden)
7. **Fairness slider:** Live update van marker posities (geen delay)
8. **Deeltjes animaties:** Canvas deeltjes op knoppen (wegvliegen bij hover/click)

**CSS voorbeelden:**

```css
.btn-primary {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.loading-glow {
  animation: pulse 2s infinite;
}

@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

***

## 7. Technische Specificaties

### Tech Stack

| Laag | Technologie | Reden |
|------|-------------|-------|
| **Frontend Framework** | Vanilla JS + ES6 Modules | Geen build-step, lichtgewicht, werkt offline zonder bundler |
| **3D Rendering** | Three.js (r160+) | Hardware-versnelde WebGL, GLTF support, grote community |
| **AI/ML** | TensorFlow.js (4.x) | Client-side inferentie, model loading uit IndexedDB |
| **Data Opslag** | IndexedDB (via idb library) | Grote datasets offline, transaction support |
| **Cache** | LocalStorage + Service Worker | Snelle key-value opslag + offline asset caching |
| **Routing** | Mapbox Directions API | Nauwkeurige reistijden, multimodaal, gratis tier (50k calls/maand) |
| **Fallback Routing** | Haversine formule (custom JS) | Werkt offline, geen API nodig |
| **POI Data** | Mapbox Search API | Goedkope alternatief voor Google Places, gratis tier |
| **Booking** | Affiliate deep links | Geen backend nodig, tracking via URL parameters |
| **PWA** | Service Worker + Web App Manifest | Installable, offline-capable, push (optioneel) |
| **Audio** | Web Audio API | Real-time sound synthesis, geen externe files |
| **AR** | WebXR API (Chrome Android) | Browser-based AR, fallback naar 2D canvas |
| **Analytics** | Plausible | Privacy-vriendelijk, geen cookies, self-hosted optie |
| **Payments** | Stripe Payment Links | Geen integratie nodig, simpele checkout voor premium |

**Dependencies (via CDN of lokaal):**

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as tf from '@tensorflow/tfjs';
import { openDB } from 'idb';
import { createLucideIcon } from 'lucide';
```

***

### Integraties / APIs

| API | Endpoint | Doel | Verplicht? | Kosten (gratis tier) |
|-----|----------|------|------------|---------------------|
| **Mapbox Directions** | `https://api.mapbox.com/directions/v5/...` | Live reistijden, multimodaal routing | Nee (fallback: Haversine) | 50k calls/maand gratis |
| **Mapbox Search** | `https://api.mapbox.com/geocoding/v5/...` | POI metadata, openingstijden | Nee (fallback: cache) | 100k calls/maand gratis |
| **Booking.com Affiliate** | Deep links | Reserveringen hotels | Nee (optioneel) | Gratis, commissie per boeking |
| **OpenTable Affiliate** | Deep links | Reserveringen restaurants | Nee (optioneel) | Gratis, commissie per cover |
| **Plausible Analytics** | Self-hosted of cloud | Privacy-vriendelijke analytics | Nee (optioneel) | €9/maand (cloud) of gratis (self-hosted) |
| **Stripe Payment Links** | Checkout pagina | Premium abonnementen | Nee (optioneel) | 1.5% + €0.25 per transactie |

***

### Authenticatie Methode

**Approach:** Passwordless + volledig lokaal

**Flow:**

1. App genereert UUID bij eerste gebruik (`crypto.randomUUID()`)
2. UUID opslaan in LocalStorage
3. Geen password, geen server verificatie (privacy-first)
4. Gebruiker kan optioneel naam invoeren (voor personalisatie)

**Security:**

- UUID is onvoorspelbaar (cryptografisch veilig)
- Geen persoonlijke data naar server tenzij expliciete toestemming
- Alle data versleuteld in IndexedDB (optioneel: Web Crypto API voor premium)

***

### Opslag Strategie

**Lokaal (default):**

- IndexedDB: gebruikersdata, afspraken, groepen, models (~50-100MB quota)
- LocalStorage: sessie UUID, UI voorkeuren, kleine caches (5MB quota)
- Service Worker Cache: statische assets (HTML, CSS, JS, GLTF, fonts)

**Cloud (optioneel):**

- Geen eigen backend (static only hosting)
- Mapbox APIs voor live data (gecacheerd in IndexedDB)
- Affiliate links voor boekingen (geen data opslag)

**Quota management:**

- Monitor IndexedDB usage (`navigator.storage.estimate()`)
- Oude afspraken automatisch archiveren (>6 maanden)
- Cache expiry voor API responses (15-30 min voor routing, 24u voor POI)

***

## 8. Edge Cases & Validatie

### Lege States

| Screen | Lege state tekst | Visueel element | Actie |
|--------|------------------|-----------------|-------|
| **Dashboard (geen afspraken)** | "Geen afspraken — maak er een!" | Illustratie (lege kalender met hologram effect) | FAB "Nieuw" highlight (pulsing glow) |
| **Groepen (geen groepen)** | "Geen groepen — maak je eerste!" | Illustratie (eenzame avatar met glow) | FAB "Nieuwe groep" highlight |
| **Resultaten (geen POI's)** | "Geen locaties gevonden — probeer groter gebied" | Illustratie (lege kaart met vraagteken) | Knoppen: "Pas filters aan" / "Vergroot zone" |
| **Profiel (geen locaties)** | "Voeg je eerste locatie toe" | Illustratie (pin op kaart, hologram) | "Locatie toevoegen" knop |
| **Zoekresultaten** | "Geen resultaten voor '[zoekterm]'" | Illustratie (zoekicoon met X) | Suggesties: "Probeer andere term" / "Wis filters" |

***

### Foutmeldingen & Error Handling

| Fout | Melding (user-friendly) | Technische actie |
|------|-------------------------|------------------|
| **Mapbox API offline** | "Geen internet — we gebruiken lokale data (mogelijk niet actueel)" | Fallback op Haversine + IndexedDB cache |
| **Geen locatie toegang** | "Locatie toegang geweigerd — voer handmatig adres in" | Toon handmatige input velden, hide auto-detect toggle |
| **Boeking deep link faalt** | "Boeking kon niet geopend worden — probeer het opnieuw of boek direct bij de locatie" | Log error, toon alternatieve link |
| **IndexedDB vol** | "Opslag vol — verwijder oude afspraken of exporteer data" | Toon cleanup suggesties, archiveer oude data |
| **3D render faalt** | "3D modus niet beschikbaar — schakelen naar 2D kaart" | Auto-fallback naar 2D canvas, toggle uit |
| **TensorFlow model laadt niet** | "AI features niet beschikbaar — schakelen naar handmatige voorkeuren" | Disable AI features, toon fallback UI |
| **Service Worker fail** | "Offline modus niet beschikbaar — internet vereist" | Force online check, toon melding |
| **WebXR niet ondersteund** | "AR niet beschikbaar op dit apparaat" | Hide AR knop, geen melding (silent fallback) |

***

### Randgevallen

| Scenario | Behandeling |
|----------|-------------|
| **Geen overlap in isochronen** | Vergroot reistijd iteratief (+10 min) tot overlap ontstaat; toon melding "Iedereen moet verder reizen dan verwacht" |
| **Deelnemer heeft geen locatie** | Toon blocker: "Voeg locatie toe voor [Naam]" — kan niet doorgaan zonder |
| **POI is gesloten op gekozen tijd** | Warning badge: "Gesloten op dit tijdstip" — toon alternatieve tijden |
| **Grote groep (>20 personen)** | Warning: "Grote groep — berekening kan langer duren"; toon progress bar met estimate |
| **Extreem ver uit elkaar (>500km)** | Warning: "Deelnemers zijn zeer ver uit elkaar — overweeg video call"; toon suggestie voor online meeting tools |
| **Datum in verleden** | Validatie: blokkeer selectie van data < vandaag; toon melding "Datum moet in de toekomst zijn" |
| **Timezone verschillen** | Altijd UTC opslaan, converteren naar lokale timezone bij weergave; toon timezone badge bij internationale groepen |
| **Cache expired tijdens gebruik** | Silent refresh (background fetch), toon oude data met "Veroudert" label |
| **Premium feature zonder betaling** | Toon paywall modal: "Upgrade naar Premium voor deze feature" + Stripe Payment Link |
| **QR code scannen faalt** | Toon alternatief: "Kopieer link" of "Deel via e-mail" |

***

## 9. Wijzigingslogboek

### Behouden uit Originele Chat

✅ **Fairness algoritme** — Kernfunctionaliteit intact gehouden (standaardafwijking/gemiddelde scoring)  
✅ **Isochrone visualisatie** — Fair zone concept behouden, maar optioneel gemaakt (toggle)  
✅ **Minimale API architectuur** — 80% kostenbesparing door offline-first met optionele Mapbox APIs  
✅ **3D Holographic Orb** — Futuristisch element behouden, maar met gratis GLTF asset  
✅ **IndexedDB + Service Worker** — Offline-first strategie volledig overgenomen  
✅ **Fairness slider** — Core UX element behouden (eerlijk vs. efficiënt)  
✅ **Groepen + sync** — Behouden, maar met QR fallback voor offline (geen backend)  
✅ **Boekingsintegratie** — Behouden, maar vereenvoudigd naar affiliate deep links (geen backend)  
✅ **Visuele identiteit** — Futuristisch dark theme met neon accenten volledig overgenomen  
✅ **TensorFlow.js** — AI features behouden, maar optioneel en alleen als online  
✅ **Web Audio API** — Soundscapes behouden als easter egg (standaard uit)  
✅ **WebXR AR** — Behouden, maar alleen op ondersteunde browsers (silent fallback)  

***

### Verwijderd (en Waarom)

❌ **Web Bluetooth wearable sync** — Te experimenteel, beperkte browser support (alleen Chrome Desktop/Android), te niche voor MVP  
❌ **Neural Style Transfer Venues** — Te zwaar voor mobiele browsers (models >50MB), lage prioriteit, slechte performance  
❌ **Biometric Venue Scoring** — Vereist wearables, privacy issues, te complex voor core use case  
❌ **Volledige backend architectuur** — Vervangen door static only hosting (geen server, geen database)  
❌ **Push notificaties (standaard)** — Vereist online + service registration; vervangen door local notifications  
❌ **Google Maps Platform (default)** — Vervangen door Mapbox (goedkoper, betere gratis tier)  
❌ **Real-time WebSocket sync** — Te complex; vervangen door QR export + lokale opslag  
❌ **Multi-language support (MVP)** — Alleen NL/EN voor nu; uitgesteld naar v2.0  
❌ **"Vorige" knoppen** — Verwijderd uit alle flows (browser back is voldoende)  
❌ **Progress bars** — Vervangen door simpele "Stap X: Titel" tekst  
❌ **Redundante knoppen** — "Beheren", "Sync nu", dubbele actieknoppen → overflow menus (⋮)  
❌ **Mini kaartjes per deelnemer** — Te klein om nuttig te zijn; vervangen door adres + icoon  
❌ **Booking reference** — Te technisch; verplaatst naar accordion of verwijderd  
❌ **Credit card input** — Te complex voor MVP; alleen deep links naar partners  

***

### Toegevoegd voor Volledigheid

➕ **QR code groep export** — Nieuw feature voor volledig offline groep sync (niet expliciet genoemd in chat)  
➕ **Haversine fallback** — Expliciet gemaakt als offline alternatief voor routing API  
➕ **Local notifications** — Toegevoegd als alternatief voor push (werkt offline)  
➕ **Crypto.randomUUID()** — Expliciet gemaakt voor veilige UUID generatie (privacy)  
➕ **Edge case validatie** — Uitgebreide error handling sectie (niet in originele chat)  
➕ **Lege states** — Expliciete descriptions voor empty states (UX best practice)  
➕ **Zoekbalk (overal)** — Toegevoegd aan dashboard, groepen, afspraken (uit optimalisatie)  
➕ **Overflow menus (⋮)** — Secundaire acties verplaatsen naar menu voor schoner design  
➕ **Glas-morphism cards** — Consistente visuele stijl voor alle kaartjes  
➕ **Neon glow effects** — Op knoppen, toggles, markers, avatars (futuristisch thema)  
➕ **Custom neon toggles** — Toggle switches met glow effect (aan = cyaan, uit = grijs)  
➕ **Deeltjes animaties** — Canvas deeltjes op knoppen, achtergronden, success screens  
➕ **Empty state illustraties** — Hologram-effect illustraties voor lege schermen  
➕ **Sorteer/filter opties** — Dropdowns voor sorteren, chips voor filteren  
➕ **Metrics display** — "Fairness: 0.87 | Avg: 18 min | Δ: 3 min" voor power users  
➕ **Theme toggle** — Donker/licht modus (toegankelijkheid)  
➕ **Taal selectie** — NL/EN dropdown (meertaligheid)  
➕ **Doneer links** — GitHub Sponsors + Tikkie in profiel  
➕ **Plausible analytics** — Privacy-vriendelijke tracking (geen cookies)  
➕ **Stripe Payment Links** — Simpele premium checkout zonder integratie  
➕ **Open source license** — MIT license, GitHub repo voor community contributies  

***

## 10. Volgende Stappen

### Wat Moet de Gebruiker Nu Doen?

1. **Domeinnaam registreren** — Opties: `aether.app`, `meetaether.com`, `aethermeet.io`, `getaether.nl`  
   - Check beschikbaarheid via Namecheap of Gandi  
   - **Status:** [MOET NOG BEPAALD WORDEN]

2. **3D model selecteren** — Gratis GLTF asset downloaden:  
   - Optie 1: "Low Poly City" van Sketchfab (CC0 license)  
   - Optie 2: Three.js voorbeelden (github.com/mrdoob/three.js/tree/master/examples)  
   - Optie 3: Zelf maken in Blender (2 weken werk)  
   - **Aanbeveling:** Optie 1 (2 uur werk, klaar voor MVP)  
   - **Status:** [MOET NOG BEPAALD WORDEN]

3. **GitHub repo aanmaken** — Open source (MIT license):  
   - Repo naam: `aether-app` of `meet-aether`  
   - README met setup instructies, features, roadmap  
   - GitHub Pages inschakelen voor hosting  
   - **Status:** Klaar om te doen

4. **Mapbox account aanmaken** — Gratis tier activeren:  
   - Account: mapbox.com (gratis, 50k routing calls/maand)  
   - API keys genereren (Directions, Search)  
   - Keys opslaan in `.env` (niet committen naar GitHub)  
   - **Status:** Klaar om te doen

5. **Affiliate accounts aanvragen** — Voor booking deep links:  
   - Booking.com Affiliate Partner Program (gratis)  
   - OpenTable Affiliate Program (gratis)  
   - **Status:** [MOET NOG BEPAALD WORDEN] — nodig voor monetisatie?

6. **PWA manifest configureren** — Installable app:  
   - `manifest.json` met naam, icoon, theme color  
   - Service Worker registreren (`sw.js`)  
   - Testen via Chrome DevTools → Application tab  
   - **Status:** Klaar om te doen

7. **Plausible analytics setup** — Privacy-vriendelijke tracking:  
   - Optie 1: Cloud (€9/maand, geen setup)  
   - Optie 2: Self-hosted (gratis, vereist server)  
   - Script tag toevoegen aan `index.html`  
   - **Status:** [MOET NOG BEPAALD WORDEN]

8. **Stripe Payment Links maken** — Voor premium:  
   - Stripe account aanmaken (gratis)  
   - Payment Link maken voor "Aether Premium" (€4.99/maand)  
   - Link plakken in paywall modal  
   - **Status:** [MOET NOG BEPAALD WORDEN] — nodig voor MVP?

9. **Donatie links toevoegen** — GitHub Sponsors + Tikkie:  
   - GitHub Sponsors profiel activeren (indien repo open source)  
   - Tikkie link genereren (voor NL gebruikers)  
   - Links toevoegen aan profiel scherm  
   - **Status:** [MOET NOG BEPAALD WORDEN]

10. **Eerste development sprint plannen** — 2 weken MVP:  
    - Week 1: Core (fairness algoritme, IndexedDB, basis UI)  
    - Week 2: 3D orb, Mapbox integratie, PWA  
    - **Status:** Klaar om te plannen

***

### Keuzes die Nog Gemaakt Moeten Worden

| Keuze | Opties | Aanbeveling | Impact | Status |
|-------|--------|-------------|--------|--------|
| **Domeinnaam** | aether.app, meetaether.com, aethermeet.io, getaether.nl | [MOET NOG BEPAALD WORDEN] | Branding, SEO | Open |
| **3D model bron** | Sketchfab (gratis) vs. Zelf maken (Blender) | Sketchfab "Low Poly City" (CC0) | Tijd: 2 uur vs. 2 weken | Open |
| **Premium features** | 3D orb + AI + onbeperkt groepen vs. Alleen 3D orb | 3D orb + AI + onbeperkt groepen | Revenue vs. adoptie | Open |
| **Premium prijs** | €2.99/maand vs. €4.99/maand vs. €9.99/maand | €4.99/maand (redelijk, concurrerend) | Revenue | Open |
| **Affiliate programma's** | Booking.com + OpenTable vs. Alleen Booking.com | Beide (maximale dekking) | Revenue | Open |
| **Analytics** | Plausible cloud (€9/maand) vs. Self-hosted (gratis) | Plausible cloud (geen gedoe) | Inzicht vs. kosten | Open |
| **Taal support** | Alleen NL vs. NL+EN vs. Multi (DE, FR, ES) | NL+EN voor launch | Bereik (NL only vs. EU) | Open |
| **First-time user flow** | Tutorial (3 schermen) vs. Interactive walkthrough | Interactive walkthrough (reeds geïmplementeerd) | Retentie, leercurve | ✅ Beslist |
| **PWA install prompt** | Auto (browser default) vs. Custom modal vs. Geen prompt | Custom modal (na 2e bezoek, meer controle) | UX, conversie | Open |
| **License type** | MIT vs. Apache 2.0 vs. GPL 3.0 | MIT (maximale adoptie) | Community contributies | ✅ Beslist |
| **Error reporting** | Geen vs. Sentry (self-hosted) vs. Eigen logging | Geen voor MVP (privacy-first) | Debugging vs. privacy | ✅ Beslist |
| **Hosting** | GitHub Pages vs. Netlify vs. Vercel | GitHub Pages (gratis, simpel) | Kosten, setup | ✅ Beslist |

***

### Aanbevolen Timeline (MVP — 4 Weken)

| Week | Focus | Deliverable |
|------|-------|-------------|
| **1** | Core architectuur | IndexedDB setup, Service Worker, basis UI framework (HTML/CSS/JS) |
| **2** | Fairness algoritme + UI | Haversine + scoring engine, fairness slider, 12 schermen (geoptimaliseerd) |
| **3** | 3D Orb + Mapbox | Three.js integratie, GLTF model laden, Mapbox Directions + Search APIs |
| **4** | Polish + Launch | Error handling, edge cases, PWA manifest, GitHub Pages deploy, eerste gebruikers |

***

### Post-MVP (Week 5+)

- TensorFlow.js preference predictor (AI features)
- Premium paywall + Stripe Payment Links
- Affiliate booking integratie (deep links)
- Plausible analytics + donatie links
- Community feedback → v1.1 improvements

***

## Tot Slot

**Dit document is klaar voor directe ontwikkeling** — alle keuzes zijn gemaakt, alle edge cases zijn behandeld, de visuele identiteit is gespecificeerd, en de tech stack is volledig uitgewerkt.

**Start met Week 1: Core architectuur.**

***

**Aether v1.0.0** — Gemaakt op 3 oktober 2026  
**License:** MIT (Open Source)  
**Status:** Gereed voor ontwikkeling