# Euro Rater — Eurovision 2026 PWA

Vanilla TS (tsc only, ES modules). `src/config.ts`: countries + emoji picker set (user-editable). `src/main.ts`: all app logic.
Compiles to `public/js/`. Local dev: `npm run build && npx serve public`. Deploy: GitHub Actions → GitHub Pages (`euro-rater` repo).
Drag reorder: Pointer Events API. State: localStorage (`euro-rater-state`). PWA install + fullscreen prompts on mobile.

25 Grand Final countries (Vienna 2026) in `COUNTRIES` array, keyed by ISO 2-letter id (e.g. `gb`, `dk`).
Flag images: `public/flags/<id>.png` — 128×128 circular PNGs extracted from the scorecard PDF.
Displayed with `clip-path: circle(calc(50% - 2px))` to crop flag edges.
`loadState()` filters out stored entries whose `countryId` is no longer in `COUNTRIES`, and migrates old state (ratings/notes) to the current shape — safe to add/remove countries from config.
Icons (`icon-192.png`, `icon-512.png`) generated at build time by `scripts/make-icons.js` (Node built-ins only, no deps).

## Entry state

`CountryEntry` has `countryId: string` and `emojis: string[]` (max 3, unique). No ratings or notes.

## Emoji picker

Tapping anywhere on a list row (except drag handle or an emoji chip) opens a `<dialog id="emoji-picker-dialog">` as a modal.
Content is generated in JS (`renderEmojiPickerContent`). Uses `<form method="dialog">` so the ✕ button (`type="submit"`) closes via native browser behaviour.
Backdrop clicks detected via `getBoundingClientRect` coordinate check (not `e.target === dialog`, which is unreliable cross-browser).
`#emoji-picker-dialog[open]` scoped to `[open]` attribute — without this, `display: flex` overrides the UA `dialog:not([open]) { display: none }` and the dialog stays visible when closed.

**Favorites bar** (always visible, gradient background): shows unique emojis used across all entries; ✕ close button on the right.
**Grid** (scrollable): 128 emojis in 8-column grid defined in `PICKER_EMOJIS` array in `src/config.ts` — edit that array to change the set, 8 per row, comments label each group.
Scroll position is preserved across re-renders (saved before `innerHTML = ''`, restored after).
Emoji chips on list rows are direct-remove buttons (click removes without opening picker).
