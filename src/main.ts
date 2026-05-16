import { COUNTRIES, RATING_FIELDS, RATING_MIN, RATING_MAX } from './config.js';
import type { CountryPrototype } from './config.js';

// --- Types ---

interface CountryEntry {
  countryId: string;
  ratings: Record<string, number>;
  notes: string;
}

interface AppState {
  orderedEntries: CountryEntry[];
}

interface DragState {
  countryId: string;
  targetIndex: number;
  pointerId: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// --- Constants ---

const STORAGE_KEY = 'euro-rater-state';
const FULLSCREEN_KEY = 'euro-rater-fullscreen';

// --- State ---

let appState: AppState = loadState();
let dragState: DragState | null = null;
let editingCountryId: string | null = null;
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch { /* ignore */ }
  return { orderedEntries: [] };
}

function saveState(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// --- Helpers ---

function getPrototype(id: string): CountryPrototype {
  return COUNTRIES.find(c => c.id === id)!;
}

function getDisplayEntries(): CountryEntry[] {
  if (!dragState) return appState.orderedEntries;
  const ds = dragState;
  const entries = appState.orderedEntries.filter(e => e.countryId !== ds.countryId);
  const dragged = appState.orderedEntries.find(e => e.countryId === ds.countryId)!;
  entries.splice(ds.targetIndex, 0, dragged);
  return entries;
}

// --- Screen management ---

function showScreen(name: 'list' | 'edit'): void {
  document.getElementById('list-screen')!.classList.toggle('hidden', name !== 'list');
  document.getElementById('edit-screen')!.classList.toggle('hidden', name !== 'edit');
}

// --- List Screen ---

function renderList(): void {
  const entries = getDisplayEntries();
  const list = document.getElementById('country-list')!;
  list.innerHTML = '';

  entries.forEach((entry) => {
    const proto = getPrototype(entry.countryId);
    const li = document.createElement('li');
    li.className = 'country-row';
    li.dataset.countryId = entry.countryId;
    if (dragState?.countryId === entry.countryId) {
      li.classList.add('is-dragging');
    }

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '☰';
    handle.addEventListener('pointerdown', (e) => startDrag(e, entry.countryId), { passive: false });

    const info = document.createElement('div');
    info.className = 'country-info';
    const nameEl = document.createElement('strong');
    nameEl.textContent = proto.name;
    const detailEl = document.createElement('span');
    detailEl.textContent = `${proto.song} — ${proto.artist}`;
    info.append(nameEl, detailEl);

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit ${proto.name}`);
    editBtn.addEventListener('click', () => openEdit(entry.countryId));

    li.append(handle, info, editBtn);
    list.appendChild(li);
  });

  const addBtn = document.getElementById('add-country-btn')!;
  const addedIds = new Set(appState.orderedEntries.map(e => e.countryId));
  addBtn.style.display = COUNTRIES.every(c => addedIds.has(c.id)) ? 'none' : '';
}

// --- Drag ---

function startDrag(e: PointerEvent, countryId: string): void {
  e.preventDefault();
  const nonDragged = appState.orderedEntries.filter(e => e.countryId !== countryId);
  dragState = { countryId, targetIndex: nonDragged.length, pointerId: e.pointerId };
  document.addEventListener('pointermove', onDragMove, { passive: false });
  document.addEventListener('pointerup', onDragEnd);
  document.addEventListener('pointercancel', onDragCancel);
  renderList();
}

function onDragMove(e: PointerEvent): void {
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  e.preventDefault();

  const rows = Array.from(
    document.querySelectorAll<HTMLElement>('#country-list > li:not(.is-dragging)')
  );

  let newIndex = rows.length;
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      newIndex = i;
      break;
    }
  }

  if (newIndex !== dragState.targetIndex) {
    dragState.targetIndex = newIndex;
    renderList();
  }
}

function onDragEnd(e: PointerEvent): void {
  if (!dragState || e.pointerId !== dragState.pointerId) return;

  const ds = dragState;
  const entries = appState.orderedEntries.filter(e => e.countryId !== ds.countryId);
  const dragged = appState.orderedEntries.find(e => e.countryId === ds.countryId)!;
  entries.splice(ds.targetIndex, 0, dragged);
  appState.orderedEntries = entries;
  saveState();

  dragState = null;
  cleanupDragListeners();
  renderList();
}

function onDragCancel(e: PointerEvent): void {
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  dragState = null;
  cleanupDragListeners();
  renderList();
}

function cleanupDragListeners(): void {
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  document.removeEventListener('pointercancel', onDragCancel);
}

// --- Add Country Dialog ---

function openAddDialog(): void {
  const dialog = document.getElementById('add-dialog') as HTMLDialogElement;
  const ul = document.getElementById('dialog-country-list')!;
  ul.innerHTML = '';

  const addedIds = new Set(appState.orderedEntries.map(e => e.countryId));
  const available = COUNTRIES.filter(c => !addedIds.has(c.id));

  available.forEach(proto => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'dialog-country-btn';
    btn.textContent = proto.name;
    btn.addEventListener('click', () => {
      addCountry(proto.id);
      dialog.close();
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });

  dialog.showModal();
}

function addCountry(countryId: string): void {
  appState.orderedEntries.push({
    countryId,
    ratings: Object.fromEntries(RATING_FIELDS.map(f => [f.id, 0])),
    notes: '',
  });
  saveState();
  renderList();
}

// --- Edit Screen ---

function openEdit(countryId: string): void {
  editingCountryId = countryId;
  const proto = getPrototype(countryId);
  const entry = appState.orderedEntries.find(e => e.countryId === countryId)!;

  document.getElementById('edit-country-name')!.textContent = proto.name;
  document.getElementById('edit-song-artist')!.textContent = `${proto.song} — ${proto.artist}`;

  const form = document.getElementById('edit-form')!;
  form.innerHTML = '';

  RATING_FIELDS.forEach(field => {
    const div = document.createElement('div');
    div.className = 'rating-field';

    const label = document.createElement('label');
    label.htmlFor = `rating-${field.id}`;
    label.textContent = field.label;

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `rating-${field.id}`;
    input.min = String(RATING_MIN);
    input.max = String(RATING_MAX);
    input.value = String(entry.ratings[field.id] ?? 0);

    div.append(label, input);
    form.appendChild(div);
  });

  const notesDiv = document.createElement('div');
  notesDiv.className = 'notes-field';

  const notesLabel = document.createElement('label');
  notesLabel.htmlFor = 'edit-notes';
  notesLabel.textContent = 'Notes';

  const notesArea = document.createElement('textarea');
  notesArea.id = 'edit-notes';
  notesArea.value = entry.notes ?? '';
  notesArea.rows = 5;
  notesArea.placeholder = 'Your thoughts...';

  notesDiv.append(notesLabel, notesArea);
  form.appendChild(notesDiv);

  showScreen('edit');
}

function saveEdit(): void {
  if (!editingCountryId) return;
  const entry = appState.orderedEntries.find(e => e.countryId === editingCountryId)!;

  RATING_FIELDS.forEach(field => {
    const input = document.getElementById(`rating-${field.id}`) as HTMLInputElement;
    const val = parseInt(input.value, 10);
    entry.ratings[field.id] = isNaN(val) ? 0 : Math.max(RATING_MIN, Math.min(RATING_MAX, val));
  });

  const notesArea = document.getElementById('edit-notes') as HTMLTextAreaElement;
  entry.notes = notesArea.value;

  saveState();
  editingCountryId = null;
  showScreen('list');
  renderList();
}

// --- PWA Install ---

function initInstallBanner(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
    document.getElementById('install-banner')!.classList.remove('hidden');
  });

  document.getElementById('install-accept')!.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    document.getElementById('install-banner')!.classList.add('hidden');
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
  });

  document.getElementById('install-dismiss')!.addEventListener('click', () => {
    document.getElementById('install-banner')!.classList.add('hidden');
  });
}

// --- Fullscreen ---

function initFullscreen(): void {
  if (!window.matchMedia('(display-mode: standalone)').matches) return;
  if (!document.documentElement.requestFullscreen) return;

  const pref = localStorage.getItem(FULLSCREEN_KEY);
  if (pref === 'yes') {
    document.documentElement.requestFullscreen().catch(() => { /* ignore */ });
  } else {
    showFullscreenPrompt();
  }
}

function showFullscreenPrompt(): void {
  const overlay = document.getElementById('fullscreen-overlay')!;
  overlay.classList.remove('hidden');

  document.getElementById('fullscreen-yes')!.addEventListener('click', () => {
    localStorage.setItem(FULLSCREEN_KEY, 'yes');
    overlay.classList.add('hidden');
    document.documentElement.requestFullscreen().catch(() => { /* ignore */ });
  }, { once: true });

  document.getElementById('fullscreen-no')!.addEventListener('click', () => {
    overlay.classList.add('hidden');
  }, { once: true });
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-country-btn')!.addEventListener('click', openAddDialog);
  document.getElementById('close-dialog-btn')!.addEventListener('click', () => {
    (document.getElementById('add-dialog') as HTMLDialogElement).close();
  });
  document.getElementById('save-close-btn')!.addEventListener('click', saveEdit);

  renderList();
  initInstallBanner();
  initFullscreen();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* ignore */ });
  }
});
