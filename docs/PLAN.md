# Aether — Goedgekeurd plan

**Goedgekeurd:** 3 oktober 2026 (V1–V11 akkoord, plus de "demo-modus" hieronder)
**Spec:** `docs/SPEC.md` — waar dit plan afwijkt, geldt dit plan.

---

## 1. Samenvatting

Aether is een installeerbare webapp (PWA) die voor een groep mensen de plek berekent waar
iedereen ongeveer even lang naartoe reist, in plaats van alleen de kortste totale reistijd.
Alles draait en wordt opgeslagen op je eigen toestel: geen account, geen server.
Doelgroep: groepen vrienden/collega's (3–12 personen) in Nederland, met een futuristische neon-interface.

## 2. Demo-modus (belangrijkste besluit)

De app wordt gebouwd **alsof hij met alle diensten verbonden is**, maar alle "online" data is
**fictief en zit in de repository** (JSON in `data/`, pagina's in `partners/`). Er gaat geen enkel
verzoek naar een externe dienst. Daardoor:

- zijn er geen API-sleutels, accounts of kosten nodig;
- werkt de hele app 100% offline na de eerste keer laden;
- kunnen we later per dienst een echte koppeling inpluggen.

**Hoe:** elke dienst heeft één vaste "voorkant" in `js/services/` (bijv. `routing.js`). Die roept
nu een nep-versie aan in `js/services/mock/`. De nep-versie leest de JSON-bestanden en doet alsof
er een netwerk is (korte vertraging van 200–600 ms, laad-animaties). Later vervangen we alleen
de mock door een echte versie; de schermen merken daar niets van.

**Fictieve diensten** (verzonnen namen, geen echte merken):

| Fictieve dienst | Speelt de rol van | Data in repo |
|---|---|---|
| **Routara** | Routes & reistijden (zoals Mapbox Directions/Matrix) | Berekend: Haversine × omrijfactor ÷ snelheid, plus een vaste "drukte"-variatie per uur (spits) zodat het "live" voelt |
| **Plekwijzer** | Horeca zoeken: ratings, reviews, prijs, openingstijden, foto's | `data/venues.json` (~80 fictieve zaken rond echte stadscentra) |
| **Adresboek-zoeker** | Adres → coördinaten (geocoding) | `data/addresses.json` (fictieve adressen in echte steden) |
| **Tafelaar** | Restaurant reserveren | `partners/tafelaar.html` (nep-boekingspagina die terugstuurt naar de app) |
| **Overnachter** | Hotel/vergaderruimte boeken | `partners/overnachter.html` |

- **Echte coördinaten van steden, fictieve zaken en personen.** Foto's zijn gegenereerde SVG-verlopen (geen externe afbeeldingen).
- **Scherm 9 "Boeking bevestigd"** kan in de demo écht bevestigen: de nep-partnerpagina stuurt de gebruiker terug met `#/boeking/klaar?status=confirmed`. (Bij echte partners later: "Afspraak vastgelegd — is het reserveren gelukt?")
- **Profiel → "Verbindingen"** toont de fictieve diensten als "Verbonden (demo)", plus een schakelaar **"Simuleer offline"** om de fallback-meldingen te laten zien.
- **Demo-data laden:** een knop in de lege schermen en in Profiel vult de app met een voorbeeldgroep ("Vrijdagborrel", 4 fictieve personen). Een klein label "Demo — alle data is fictief" staat in Profiel → Over.

## 3. Besluiten (V1–V11, akkoord)

| # | Besluit |
|---|---|
| V1 | Groepsleden = **lokale contacten** (naam, startadres, vervoer) op jouw toestel; jij bent er één van. Minimaal 2 leden = jij + 1. |
| V2 | Adres → coördinaten via de (fictieve) adreszoeker; plus "Mijn huidige locatie" (GPS) en kiezen uit een lijst steden. |
| V3 | Geen sleutels in de repo. (In demo-modus zijn er helemaal geen sleutels nodig.) |
| V4 | Kandidaat-plekken: lijst NL-stadscentra/stations + raster rond het midden van de groep; daarna zaken (Plekwijzer) rond de 3 eerlijkste gebieden. |
| V5 | Velden tonen we alleen als de bron ze levert. In de demo levert Plekwijzer alles (fictief). `rating` en `price_level` blijven in het datamodel optioneel. |
| V6 | Dependencies: `three`, `idb`, `qrcode-generator` (gekopieerd naar `/vendor`), dev: `vitest`, `eslint`. Niets anders zonder te vragen. |
| V7 | Fonts zelf hosten in `assets/fonts/` (woff2). |
| V8 | Alleen Nederlands; alle teksten in `js/i18n/nl.js`. Alleen donker thema (tokens voorbereid op licht). |
| V9 | Hash-routing (`#/groepen`). |
| V10 | Geschrapt voor MVP: "Check mijn agenda", "Drukte nu", auto-detect van anderen, online-status, paywall, isochronen. |
| V11 | Simpele tijdkiezer (chips) eerst; cirkelvormige later als polish. |

Overige besluiten uit de analyse:
- **Account verwijderen** → "Alle gegevens wissen". **Online status** vervalt.
- **Herinneringen** → `.ics`-agendabestand + melding in de app bij openen.
- **3D** → zelfgemaakte hologram-orb, geen GLTF-stadsmodel nodig.
- **QR-export** → QR bevat een link `…/#import=<data>`; fallback: link delen of `.json`-bestand.
- **Reserveer-links** per type: restaurant → Tafelaar, hotel/vergaderruimte → Overnachter, café/bar → kaart-link.

## 4. Fairness-algoritme

Per kandidaat-plek met reistijden t₁…tₙ (minuten):

- μ = gemiddelde, σ = standaardafwijking (populatie)
- **fairness_score = 1 − min(σ/μ, 1)** (0–1, 1 = perfect eerlijk)
- Slider **α**: 0 = maximaal efficiënt, 1 = maximaal eerlijk (begin = `preferences.fairness_priority`)
- **kosten = μ + 2·α·σ** → laagste kosten wint (de `2` is een instelbare constante)

Rekenvoorbeeld (wordt een unit test):

| | Anna | Bram | Cem | μ | σ | Fairness | α=0 | α=0,5 | α=1 |
|---|---|---|---|---|---|---|---|---|---|
| A | 5 | 20 | 26 | 17,0 | 8,83 | 0,48 | **17,0** | **25,8** | 34,7 |
| B | 25 | 27 | 29 | 27,0 | 1,63 | 0,94 | 27,0 | 28,6 | **30,3** |

Omslagpunt bij α ≈ 0,69.

## 5. Milestones

Na elke milestone: stoppen, laten zien wat werkt en hoe het gecontroleerd is, wachten op akkoord.

| | Doel | Belangrijkste bestanden | Controle |
|---|---|---|---|
| **M0** | Repo, PWA-skelet, thema, navigatie, empty states | `index.html`, `manifest.webmanifest`, `sw.js`, `css/*`, `js/app.js`, `js/router.js`, `js/ui/nav.js`, `js/screens/*` | Tabs werken, SW actief, offline herladen werkt, lint groen, GitHub Pages live |
| **M1** | Fairness-algoritme + Haversine (geen UI) | `js/core/{geo,travel-estimate,fairness}.js`, `tests/*` | `npm test` incl. rekenvoorbeeld en randgevallen |
| **M2** | Profiel, contacten, groepen, afspraak stap 1–3, IndexedDB, adreszoeker (mock), demo-data laden | `js/data/*`, `js/services/{geocode}.js`, `js/services/mock/*`, `data/addresses.json`, `js/ui/*`, `js/screens/*` | Alles aanmaken, herladen → data blijft, blockers/validatie werken |
| **M3** | Resultaten 2D, fairness-slider, live ranking, welkomstscherm, dashboard | `js/core/candidates.js`, `data/nl-places.json`, `js/ui/{fairness-slider,map2d}.js`, `js/screens/{results,welcome,appointments}.js` | Slider verandert ranking direct, opslaan → op dashboard |
| **M4** | Fictieve diensten Routara + Plekwijzer met cache, POI-detail, Verbindingen-scherm, "Simuleer offline" | `js/services/{routing,places}.js`, `js/services/mock/*`, `data/venues.json`, `js/data/cache.js`, `js/screens/{poi-detail,connections}.js` | Laad-animaties, cache-hit, offline-simulatie → fallback-melding |
| **M5** | Three.js-orb met automatische 2D-fallback | `js/three/{orb,markers}.js`, `vendor/three.module.js` | Orb draait, markers reageren op slider, geforceerde WebGL-fout → 2D |
| **M6** | Boeken via Tafelaar/Overnachter, bevestigd-scherm, QR-export/import, `.ics`, data exporteren/wissen | `partners/*.html`, `js/services/{deeplinks,ics,share,import}.js`, `vendor/qrcode.js`, `js/screens/{booking,booking-done}.js` | Volledige boekflow rond, QR scannen → import, `.ics` opent in agenda |

## 6. Wat de gebruiker regelt

| Wat | Wanneer |
|---|---|
| GitHub-account + lege repo + Pages aanzetten (branch `main`, map `/`) | Eind M0 |
| Telefoon(s) om installeren/offline te testen | Eind M0 en M6 |
| Mapbox, affiliates, domeinnaam, 3D-model | **Niet nodig** in demo-modus |

## 7. Risico's

1. **Schattingen voelen onecht** → consistente, deterministische mock-data; "≈" bij OV.
2. **Data kwijt op iPhone** (Safari wist na ~7 dagen) → `navigator.storage.persist()`, installeer-tip, export.
3. **Oude versie blijft hangen** (service worker) → versienummer in cache, HTML network-first, banner "Nieuwe versie".
4. **Demo wordt verward met echt** → fictieve merknamen, label "Demo", geen echte bedrijven.
5. **Te groot/te zwaar** → verticale stukjes, Three.js pas laden op resultaten, `prefers-reduced-motion`.


---

## 8. Overhaul volgens het layoutconcept (goedgekeurd 4 oktober 2026)

Keuzes: concept-stijl overnemen (mint, DM Sans + Space Grotesk), demo-groep voor samenwerken (geen backend),
Plus/Teams alleen als demo-label, bouwen in stappen met akkoord.

| Stap | Inhoud | Status |
|---|---|---|
| **O1** | Nieuwe schil (zijbalk/onderbalk/bovenbalk), ontwerpsysteem, modules Overzicht, Ontdek plekken, Mijn groepen, Agenda, Activiteit, Instellingen, activiteitenlog, CO₂-vergelijking, toegankelijkheid | **klaar** |
| **O2** | Fictieve diensten Routara + Plekwijzer: zaken met filters (toegankelijk, rustig, vegetarisch), detailscherm, cache en "Simuleer offline" | **klaar** |
| **O3** | Demo-groepsleden die stemmen en vertrekpunten toevoegen; stemvenster; uitnodigen via link/QR | **klaar** |
| **O4** | Agenda met "wanneer kan iedereen" en spitsdrukte-model | open |
| **O5** | Reserveren via Tafelaar/Overnachter, `.ics`, delen, Plus-label | open |
| **O6** | 3D-orb met 2D-terugval (optioneel) | open |

CO₂-factoren (g per reizigerskilometer): auto 146, OV 28, fiets/lopen 0. Bron: CO2emissiefactoren.nl en CE Delft (STREAM Personenvervoer).
