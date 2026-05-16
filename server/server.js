const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.argv[2] || '8080', 10);

const SERVER_PUBLIC = path.join(__dirname, 'public');
const CLIENT_PUBLIC = path.join(__dirname, '..', 'client', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.json': 'application/json',
};

function resolveFilePath(url) {
  const clean = (url || '/').split('?')[0];

  if (clean === '/styles.css')
    return path.join(CLIENT_PUBLIC, 'styles.css');

  if (clean.startsWith('/flags/'))
    return path.join(CLIENT_PUBLIC, 'flags', path.basename(clean));

  if (clean === '/js/config.js')
    return path.join(CLIENT_PUBLIC, 'js', 'config.js');

  if (clean === '/' || clean === '/index.html')
    return path.join(SERVER_PUBLIC, 'index.html');

  return path.join(SERVER_PUBLIC, clean.slice(1));
}

// --- In-memory state ---

const states = new Map();  // name -> stateJson
const viewers = new Set(); // connected server-app WebSockets

// --- HTTP ---

const server = http.createServer((req, res) => {
  const filePath = resolveFilePath(req.url);
  const resolved = path.resolve(filePath);

  const allowed = resolved.startsWith(SERVER_PUBLIC) || resolved.startsWith(CLIENT_PUBLIC);
  if (!allowed) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// --- WebSocket ---

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const isViewer = (req.url || '/') === '/viewer';

  if (isViewer) {
    viewers.add(ws);
    ws.send(JSON.stringify({ type: 'update', states: Object.fromEntries(states) }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'delete' && typeof msg.name === 'string') {
          states.delete(msg.name);
          broadcast();
        }
      } catch {}
    });

    ws.on('close', () => viewers.delete(ws));

  } else {
    ws.on('message', (raw) => {
      try {
        const state = JSON.parse(raw.toString());
        if (typeof state.name !== 'string' || typeof state.timestamp !== 'number') return;
        const existing = states.get(state.name);
        if (!existing || state.timestamp > existing.timestamp) {
          states.set(state.name, state);
          broadcast();
        }
      } catch {}
    });
  }
});

function broadcast() {
  const payload = JSON.stringify({ type: 'update', states: Object.fromEntries(states) });
  for (const viewer of viewers) {
    if (viewer.readyState === 1) viewer.send(payload);
  }
}

server.listen(PORT, () => {
  console.log(`Euro Rater server → http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop.`);
});
