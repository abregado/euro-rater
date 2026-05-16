# Euro Rater

A Eurovision scoring PWA. Rate and rank countries during the Grand Final, optionally sharing your rankings live with a group via a local aggregation server.

## Client (PWA)

The client runs entirely in the browser. It only **sends** data — it never receives or displays other people's rankings. Your list is yours alone.

### Install from GitHub Pages

The client is hosted at **https://abregado.github.io/euro-rater/**.

On mobile (Chrome/Safari), visit the URL and use your browser's "Add to Home Screen" / "Install App" option. The app works offline once installed.

### Run locally

```sh
cd client
npm install
npm run build
npx serve public
```

Then open `http://localhost:3000` in your browser.

## Server

The server aggregates rankings from multiple raters and displays a live Borda-count leaderboard. Run it on a machine that all raters can reach over the local network.

```sh
cd server
npm install
node server.js         # default port 8080
node server.js 9000    # custom port
```

Open `http://<your-ip>:<port>` in a browser to see the live aggregated rankings.

### Security warning

> **Caution:** Running the server opens a WebSocket port on your machine that accepts connections from anyone who can reach it on your network. Only run the server on a network you trust (e.g. a private home or event LAN), and shut it down when you are done. Do not expose the port to the internet.

## Connecting the client to the server

1. Open the client and tap the **gear icon (⚙)** in the top-right to open Settings.
2. Enter your **name** (used to identify you on the leaderboard).
3. Enter the **server address** as `host:port` — for example `192.168.1.10:8080`. No `http://` prefix.
4. Check **Server mode** to enable the live connection.
5. The status dot turns green when connected. Your rankings are pushed automatically on every change.

Use **Send Now** to push manually, or **Export / Import** to save and restore your full list as a JSON file.
