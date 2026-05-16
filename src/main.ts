import { COUNTRIES, PICKER_EMOJIS } from './config.js';
import type { CountryPrototype } from './config.js';

// --- Types ---

interface CountryEntry {
  countryId: string;
  emojis: string[];
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
const MAX_EMOJIS = 3;

// --- State ---

let appState: AppState = loadState();
let dragState: DragState | null = null;
let pickerCountryId: string | null = null;
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as any;
      const validIds = new Set(COUNTRIES.map(c => c.id));
      return {
        orderedEntries: (parsed.orderedEntries ?? [])
          .filter((e: any) => validIds.has(e.countryId))
          .map((e: any) => ({
            countryId: e.countryId,
            emojis: Array.isArray(e.emojis) ? e.emojis : [],
          })),
      };
    }
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

    const flag = document.createElement('img');
    flag.className = 'country-flag';
    flag.src = `./flags/${entry.countryId}.png`;
    flag.alt = proto.name;
    flag.width = 36;
    flag.height = 36;

    const info = document.createElement('div');
    info.className = 'country-info';
    const nameEl = document.createElement('strong');
    nameEl.textContent = proto.name;
    const detailEl = document.createElement('span');
    detailEl.textContent = `${proto.song} — ${proto.artist}`;
    info.append(nameEl, detailEl);

    const emojiZone = document.createElement('div');
    emojiZone.className = 'emoji-zone';

    entry.emojis.forEach((emoji, idx) => {
      const chip = document.createElement('button');
      chip.className = 'emoji-chip';
      chip.textContent = emoji;
      chip.setAttribute('aria-label', `Remove ${emoji}`);
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        entry.emojis.splice(idx, 1);
        saveState();
        renderList();
      });
      emojiZone.appendChild(chip);
    });

    li.append(handle, flag, info, emojiZone);

    li.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (target.closest('.drag-handle') || target.closest('.emoji-chip')) return;
      openEmojiPicker(entry.countryId);
    });

    list.appendChild(li);
  });

  const addBtn = document.getElementById('add-country-btn')!;
  const addedIds = new Set(appState.orderedEntries.map(e => e.countryId));
  addBtn.style.display = COUNTRIES.every(c => addedIds.has(c.id)) ? 'none' : '';
}

// --- Emoji Picker ---

function openEmojiPicker(countryId: string): void {
  pickerCountryId = countryId;
  renderEmojiPickerContent();
  const dialog = document.getElementById('emoji-picker-dialog') as HTMLDialogElement;
  if (!dialog.open) dialog.showModal();
}

function makeEmojiButton(emoji: string, entry: CountryEntry): HTMLButtonElement {
  const isSelected = entry.emojis.includes(emoji);
  const atMax = entry.emojis.length >= MAX_EMOJIS;
  const btn = document.createElement('button');
  btn.type = 'button'; // must be explicit so the form[method=dialog] doesn't close on click
  btn.className = 'emoji-picker-btn';
  if (isSelected) btn.classList.add('selected');
  if (!isSelected && atMax) btn.classList.add('dimmed');
  btn.textContent = emoji;
  btn.setAttribute('aria-label', emoji);
  btn.disabled = !isSelected && atMax;
  btn.addEventListener('click', () => {
    if (isSelected) {
      entry.emojis = entry.emojis.filter(e => e !== emoji);
    } else if (entry.emojis.length < MAX_EMOJIS) {
      entry.emojis.push(emoji);
    }
    saveState();
    renderList();
    renderEmojiPickerContent();
  });
  return btn;
}

function renderEmojiPickerContent(): void {
  if (!pickerCountryId) return;
  const entry = appState.orderedEntries.find(e => e.countryId === pickerCountryId)!;
  const dialog = document.getElementById('emoji-picker-dialog') as HTMLDialogElement;

  const savedScroll = (dialog.querySelector('.emoji-picker-body') as HTMLElement | null)?.scrollTop ?? 0;
  dialog.innerHTML = '';

  const form = document.createElement('form');
  form.method = 'dialog';
  form.className = 'emoji-picker-form';

  // Favorites bar — always shown, gradient background, X button on the right
  const favSection = document.createElement('div');
  favSection.className = 'emoji-picker-favorites';

  const usedChips = document.createElement('div');
  usedChips.className = 'emoji-picker-used';
  const usedEmojis = [...new Set(appState.orderedEntries.flatMap(e => e.emojis))];
  usedEmojis.forEach(emoji => usedChips.appendChild(makeEmojiButton(emoji, entry)));
  favSection.appendChild(usedChips);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'submit';
  closeBtn.className = 'btn-icon';
  closeBtn.textContent = '✕';
  favSection.appendChild(closeBtn);

  form.appendChild(favSection);

  // Scrollable grid
  const body = document.createElement('div');
  body.className = 'emoji-picker-body';
  const grid = document.createElement('div');
  grid.className = 'emoji-picker-grid';
  PICKER_EMOJIS.forEach(emoji => grid.appendChild(makeEmojiButton(emoji, entry)));
  body.appendChild(grid);
  form.appendChild(body);

  dialog.appendChild(form);
  body.scrollTop = savedScroll;
}

function initEmojiPicker(): void {
  const dialog = document.getElementById('emoji-picker-dialog') as HTMLDialogElement;

  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom
    ) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    pickerCountryId = null;
  });
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

    const flag = document.createElement('img');
    flag.className = 'country-flag';
    flag.src = `./flags/${proto.id}.png`;
    flag.alt = proto.name;
    flag.width = 32;
    flag.height = 32;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = proto.name;

    btn.append(flag, nameSpan);
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
  appState.orderedEntries.push({ countryId, emojis: [] });
  saveState();
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

  initEmojiPicker();
  renderList();
  initInstallBanner();
  initFullscreen();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* ignore */ });
  }
});
