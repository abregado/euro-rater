import { COUNTRIES } from '/js/config.js';

// --- State ---

let serverStates = {};
let ws = null;
let reconnectDelay = 1000;

// --- Connection ---

function connect() {
  ws = new WebSocket(`ws://${window.location.host}/viewer`);

  ws.addEventListener('open', () => {
    reconnectDelay = 1000;
    setBanner(false);
  });

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'update') {
      serverStates = msg.states;
      render();
    }
  });

  ws.addEventListener('close', () => {
    ws = null;
    setBanner(true);
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      connect();
    }, reconnectDelay);
  });

  // error is always followed by close — no separate handler needed
}

function setBanner(visible) {
  document.getElementById('connection-banner').classList.toggle('hidden', !visible);
}

// --- Borda sort ---
// Only includes countries present in ALL raters' lists.
// Each rater's intersection countries are re-ranked in their original order;
// 1st = N pts, 2nd = N-1 pts, …, Nth = 1 pt. Scores summed across raters.

function bordaRank(states) {
  const lists = Object.values(states);
  if (lists.length === 0) return [];

  const sets = lists.map(s => new Set(s.orderedEntries.map(e => e.countryId)));
  const intersection = [...sets[0]].filter(id => sets.every(set => set.has(id)));
  if (intersection.length === 0) return [];

  const n = intersection.length;
  const scores = Object.fromEntries(intersection.map(id => [id, 0]));

  for (const state of lists) {
    const ranked = state.orderedEntries
      .filter(e => intersection.includes(e.countryId))
      .map(e => e.countryId);
    ranked.forEach((id, idx) => { scores[id] += n - idx; });
  }

  return [...intersection].sort((a, b) => scores[b] - scores[a]);
}

function emojiCounts(countryId, states) {
  const counts = {};
  for (const state of Object.values(states)) {
    const entry = state.orderedEntries.find(e => e.countryId === countryId);
    for (const emoji of (entry?.emojis ?? [])) {
      counts[emoji] = (counts[emoji] ?? 0) + 1;
    }
  }
  return counts;
}

// --- Render ---

function render() {
  renderCountryList();
  renderPeopleList();
}

function renderCountryList() {
  const list = document.getElementById('country-list');
  const ranked = bordaRank(serverStates);
  list.innerHTML = '';

  if (ranked.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-message';
    li.textContent = Object.keys(serverStates).length === 0
      ? 'Waiting for raters to connect…'
      : 'No countries added by all raters yet.';
    list.appendChild(li);
    return;
  }

  ranked.forEach((countryId, idx) => {
    const info = COUNTRIES.find(c => c.id === countryId);
    if (!info) return;

    const li = document.createElement('li');
    li.className = 'country-row';

    const rank = document.createElement('span');
    rank.className = 'country-rank';
    rank.textContent = String(idx + 1);

    const flag = document.createElement('img');
    flag.className = 'country-flag';
    flag.src = `/flags/${countryId}.png`;
    flag.alt = info.name;
    flag.width = 36;
    flag.height = 36;

    const infoEl = document.createElement('div');
    infoEl.className = 'country-info';
    const nameEl = document.createElement('strong');
    nameEl.textContent = info.name;
    const detailEl = document.createElement('span');
    detailEl.textContent = `${info.song} — ${info.artist}`;
    infoEl.append(nameEl, detailEl);

    const emojiZone = document.createElement('div');
    emojiZone.className = 'emoji-zone';
    for (const [emoji, count] of Object.entries(emojiCounts(countryId, serverStates))) {
      const pill = document.createElement('span');
      pill.className = 'emoji-pill';
      pill.textContent = emoji;
      if (count > 1) {
        const badge = document.createElement('span');
        badge.className = 'emoji-pill-count';
        badge.textContent = String(count);
        pill.appendChild(badge);
      }
      emojiZone.appendChild(pill);
    }

    li.append(rank, flag, infoEl, emojiZone);
    list.appendChild(li);
  });
}

function renderPeopleList() {
  const list = document.getElementById('people-list');
  list.innerHTML = '';

  for (const [name, state] of Object.entries(serverStates)) {
    const li = document.createElement('li');
    li.className = 'people-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'people-name';
    nameEl.textContent = name;

    const timeEl = document.createElement('span');
    timeEl.className = 'people-timestamp';
    timeEl.textContent = formatAgo(state.timestamp);

    const del = document.createElement('button');
    del.className = 'btn-trash';
    del.textContent = '🗑';
    del.setAttribute('aria-label', `Remove ${name}`);
    del.addEventListener('click', () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'delete', name }));
      }
    });

    li.append(nameEl, timeEl, del);
    list.appendChild(li);
  }
}

function formatAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  connect();
  // Refresh "X ago" timestamps every 30s without needing a server push
  setInterval(() => {
    if (Object.keys(serverStates).length > 0) renderPeopleList();
  }, 30000);
});
