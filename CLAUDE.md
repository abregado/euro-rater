# Euro Rater — Eurovision 2026

Monorepo with a PWA client (`client/`) and a Node.js aggregation server (`server/`).

## Client (`client/`)

Vanilla TS (tsc only, ES modules). `src/config.ts`: countries + emoji picker set (user-editable). `src/main.ts`: all app logic.
Compiles to `public/js/`. Local dev: `cd client && npm run build && npx serve public`.
Deploy: GitHub Actions → GitHub Pages (`euro-rater` repo) — workflow builds `client/` and uploads `client/public`.
Drag reorder: Pointer Events API. State: localStorage (`euro-rater-state`). Settings: localStorage (`euro-rater-settings`).
PWA install + fullscreen prompts on mobile.

25 Grand Final countries (Vienna 2026) in `COUNTRIES` array in `config.ts`, keyed by ISO 2-letter id (e.g. `gb`, `dk`).
Flag images: `client/public/flags/<id>.png` — 128×128 circular PNGs extracted from the scorecard PDF.
Displayed with `clip-path: circle(calc(50% - 2px))` to crop flag edges.
`loadState()` filters out stored entries whose `countryId` is no longer in `COUNTRIES`, and migrates old state to the current shape — safe to add/remove countries from config.
Icons (`icon-192.png`, `icon-512.png`) generated at build time by `scripts/make-icons.js` (Node built-ins only, no deps).

### Entry state

`CountryEntry` has `countryId: string` and `emojis: string[]` (max 3, unique). No ratings or notes.

### Emoji picker

Tapping anywhere on a list row (except drag handle or an emoji chip) opens a `<dialog id="emoji-picker-dialog">` as a modal.
Content is generated in JS (`renderEmojiPickerContent`). Uses `<form method="dialog">` so the ✕ button (`type="submit"`) closes via native browser behaviour.
Backdrop clicks detected via `getBoundingClientRect` coordinate check (not `e.target === dialog`, which is unreliable cross-browser).
`#emoji-picker-dialog[open]` scoped to `[open]` attribute — without this, `display: flex` overrides the UA `dialog:not([open]) { display: none }` and the dialog stays visible when closed.

**Favorites bar** (always visible, gradient background): shows unique emojis used across all entries; ✕ close button on the right.
**Grid** (scrollable): 128 emojis in 8-column grid defined in `PICKER_EMOJIS` array in `src/config.ts` — edit that array to change the set, 8 per row, comments label each group.
Scroll position is preserved across re-renders (saved before `innerHTML = ''`, restored after).
Emoji chips on list rows are direct-remove buttons (click removes without opening picker).

### Settings screen

Gear icon (⚙) in the list header opens a full-screen settings panel. Fields:
- **Name**: sent to server to identify this rater
- **Server address**: `host:port` (no protocol prefix)
- **Server mode** (checkbox): enables persistent WebSocket connection with auto-reconnect (exponential backoff 1s→30s)
- **Status dot**: off / connected (green glow) / disconnected (pink glow)
- **Send Now**: manually pushes current state
- **Export / Import**: JSON file round-trip of full app state

WebSocket sends `{ name, timestamp, orderedEntries }` on every state change. Reconnects automatically while server mode is on.

## Server (`server/`)

Node.js, no framework. Single dependency: `ws` (WebSocket). Run: `node server/server.js [port]` (default 8080).

Serves static files from two roots:
- `server/public/` — server web app (`index.html`, `app.js`)
- `client/public/` — shared assets: `styles.css`, `flags/`, `js/config.js`

WebSocket roles by path: `/` = voting client, `/viewer` = live-view browser tab.

Aggregation: stores latest state per rater name (keyed by `name`, overwritten if new `timestamp` is newer). On any update, broadcasts `{ type: 'update', states }` to all viewers.
Viewer can send `{ type: 'delete', name }` to remove a rater.

### Server web app (`server/public/`)

`app.js` imports `COUNTRIES` from `/js/config.js` (compiled client config, served by server).
Displays Borda-count ranked list of countries present in **all** raters' lists (intersection only).
Borda scoring: 1st = N pts, …, Nth = 1 pt; scores summed across raters. Emoji pills show per-emoji counts.
People section lists raters with "Xs ago" timestamps (refreshed every 30s client-side) and delete buttons.
Auto-reconnects to WebSocket with exponential backoff on disconnect.
