# Euro Rater — Eurovision 2026 PWA

Vanilla TS (tsc only, ES modules). `src/config.ts`: countries + rating fields (user-editable). `src/main.ts`: all app logic.
Compiles to `public/js/`. Local dev: `npm run build && npx serve public`. Deploy: GitHub Actions → GitHub Pages (`euro-rater` repo).
Ratings: 0–20. Drag reorder: Pointer Events API. State: localStorage (`euro-rater-state`). PWA install + fullscreen prompts on mobile.

25 Grand Final countries (Vienna 2026) in `COUNTRIES` array, keyed by ISO 2-letter id (e.g. `gb`, `dk`).
Flag images: `public/flags/<id>.png` — 128×128 circular PNGs extracted from the scorecard PDF.
Displayed with `clip-path: circle(calc(50% - 2px))` to crop flag edges. Edit screen flag uses `filter: drop-shadow` for gold glow (border can't survive clip-path).
`loadState()` filters out any stored entries whose `countryId` is no longer in `COUNTRIES` — safe to add/remove countries from config.
Icons (`icon-192.png`, `icon-512.png`) generated at build time by `scripts/make-icons.js` (Node built-ins only, no deps).
