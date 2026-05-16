# Euro Rater — Eurovision 2026 PWA

Vanilla TS (tsc only, ES modules). `src/config.ts`: countries + rating fields (user-editable). `src/main.ts`: all app logic.
Compiles to `public/js/`. Local dev: `npm run build && npx serve public`. Deploy: GitHub Actions → GitHub Pages (`euro-rater` repo, `/euro-rater/` base).
Ratings: 0–20. Drag reorder: Pointer Events API. State: localStorage. PWA install + fullscreen prompts on mobile.
