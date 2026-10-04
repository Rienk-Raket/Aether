# Aether

Offline-first PWA that finds the fairest meeting place for a group, based on travel time.

> **Demo mode:** all "online" data (routes, venues, bookings) is fictional and bundled in
> this repository. The app makes no network requests to third parties and runs fully offline.

## Live

https://rienk-raket.github.io/Aether/

Deploys automatically from the `main` branch (GitHub Pages, root folder).

## Run locally

```bash
npm install
npx serve .
```

Open the printed `http://localhost:...` URL.

## Scripts

- `npm test` — unit tests (Vitest) for pure logic
- `npm run lint` — ESLint
- `npm run sw` — regenerate the offline file list in `sw.js` (run after adding files or changing the version in `package.json`)
- `npm run vendor` — copy browser builds of dependencies into `vendor/`

## Docs

- `docs/SPEC.md` — original specification
- `docs/PLAN.md` — approved build plan (takes precedence over the spec)

## License

MIT. Fonts (Rajdhani, Inter, Space Mono) are licensed under the SIL Open Font License.
