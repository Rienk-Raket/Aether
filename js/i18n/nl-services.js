// Dutch strings for the (fictional) online services: loading, offline, venues and connections.
// Merged into `t` by nl.js.

export const services = {
  loading: {
    default: 'Laden…',
    routes: 'Reistijden ophalen bij Routara…',
    venues: 'Zaken ophalen bij Plekwijzer…',
    venue: 'Zaak ophalen…',
  },

  sources: {
    live: 'live',
    cache: 'uit cache',
    stale: 'verouderd (offline)',
    estimate: '≈ offline schatting',
  },

  offline: {
    notice: 'Geen internet — we gebruiken lokale data (mogelijk niet actueel).',
    noVenuesTitle: 'Geen internet',
    noVenues: 'De zaken van dit gebied zijn nog niet bewaard op dit toestel. Maak weer verbinding en probeer het opnieuw.',
  },

  venues: {
    typeFilter: 'Soort zaak',
    all: 'Alles',
    switches: { accessible: 'Toegankelijk', quiet: 'Rustige plek', vegetarian: 'Vegetarische opties' },
    title: (area) => `Zaken in ${area}`,
    empty: 'Geen locaties gevonden — probeer een groter gebied',
    adjustFilters: 'Pas filters aan',
    widerZone: 'Vergroot zone',
    count: (shown, total) => `${shown} van ${total} zaken`,
    closedAt: 'Gesloten op dit tijdstip',
    closedWarning: (time) => `Gesloten op dit tijdstip (${time}). Kies een ander moment of een andere zaak.`,
    crowd: { low: 'Drukte: laag', medium: 'Drukte: gemiddeld', high: 'Drukte: hoog' },
  },

  venue: {
    back: 'Terug naar plekken',
    openMap: 'Open op kaart',
    fictional: 'Fictieve zaak voor de demo.',
    features: 'Kenmerken',
    noFeatures: 'Geen bijzondere kenmerken bekend',
    crowdAt: (time) => `verwacht om ${time} (voorspelling)`,
    hours: 'Openingstijden',
    travel: 'Reistijden',
    choose: 'Kies deze zaak',
    alreadyChosen: 'Deze zaak is gekozen voor de afspraak.',
    chosenToast: (name) => `${name} gekozen`,
  },

  connections: {
    title: 'Verbindingen',
    intro: 'In deze demo praat Aether met fictieve diensten. Er gaat niets naar echte bedrijven.',
    routara: 'Reistijden en verkeer',
    plekwijzer: 'Zaken, openingstijden en beoordelingen',
    geocoder: 'Adressen zoeken',
    tafelaar: 'Restaurants reserveren',
    overnachter: 'Hotels en vergaderruimtes boeken',
    calendar: 'Afspraken in je agenda zetten',
    calendarName: 'Agenda',
    soon: 'Binnenkort',
    onDevice: 'Op dit toestel',
    connected: 'Verbonden (demo)',
    offline: 'Offline',
    simulateOffline: 'Simuleer offline',
    simulateHint: 'Laat zien hoe Aether werkt zonder internet.',
    cache: 'Opgeslagen antwoorden',
    cacheHint: 'Reistijden (30 minuten) en zaken (24 uur) worden bewaard.',
    clearCache: 'Cache legen',
    cacheCleared: 'Cache geleegd',
    nowOffline: 'Offline-modus aan (gesimuleerd)',
    nowOnline: 'Weer online',
  },

  status: {
    online: { label: 'Demo', long: ' · lokaal opgeslagen' },
    offline: { label: 'Offline', long: ' · lokale data' },
  },
};
