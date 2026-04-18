import { renderChart } from './chart.js';
import { renderSessionsList } from './sessions.js';
import { StorageManager } from './storage.js';
import { initSwipe } from './swipe.js';

import {
  groupSessionsByDay,
  formatTime,
  formatCurrentTime,
  getDayformatDate,
  getTotal,
} from './helpers.js';

import {
  COLLAPSE_KEY,
  SWIPE_THRESHOLD,
  SWIPE_LIMIT,
  categories,
} from './constants.js';

import { createTimer } from './timer.js';

let visibleCount = 100;

const UI = {
  timer: document.getElementById('timer'),
  display: document.getElementById('time-display'),
  select: document.getElementById('category-select'),
};

const timer = document.getElementById('timer');
const display = document.getElementById('time-display');
const select = document.getElementById('category-select');
export const nodeSessionsList = document.getElementById('session-container');
const settingsBtn = document.getElementById('settings-button');
const settingsMenu = document.getElementById('settings-menu');

const timerInstance = createTimer(display, formatTime);
// =====================================helpers:
const sessionHelpers = {
  formatTime,
  formatCurrentTime,
  getDayformatDate,
  getCollapsedState,
  setCollapsedState,
  groupSessionsByDay,
  getTotal,
};

export function setCollapsedState(state) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
}

export function getCollapsedState() {
  return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {};
}

settingsBtn.onclick = () => {
  settingsMenu.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
  if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
    settingsMenu.classList.add('hidden');
  }
});

const toggleBtn = document.getElementById('toggle-button');
const toggleIcon = document.getElementById('toggle-icon');

function isRunning() {
  return StorageManager.getActiveSession() !== null;
}

function updateToggleButton() {
  if (isRunning()) {
    toggleBtn.classList.remove('start');
    toggleBtn.classList.add('stop');
    toggleIcon.className = 'fa-solid fa-stop';
  } else {
    toggleBtn.classList.remove('stop');
    toggleBtn.classList.add('start');
    toggleIcon.className = 'fa-solid fa-play';
  }
}

toggleBtn.onclick = () => {
  if (!isRunning()) {
    // START
    const category = select.value || 'other';

    const session = {
      start: Date.now(),
      category,
    };

    StorageManager.setActiveSession(session);
    StorageManager.setLastCategory(category);

    timer.classList.add('running');
    timerInstance.start(session.start);
  } else {
    // STOP
    const session = StorageManager.getActiveSession();
    const end = Date.now();
    const duration = end - session.start;

    const sessions = [...StorageManager.getSessions()];
    StorageManager.setSessions([...sessions, { ...session, end, duration }]);

    StorageManager.removeActiveSession();

    timer.classList.remove('running');

    timerInstance.reset();
    updateSessionsUI();
  }

  updateToggleButton();
};

export function populateCategories() {
  select.innerHTML = '';

  const lastCategory = StorageManager.getLastCategory();

  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;

    if (cat === lastCategory) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

function updateSessionsUI() {
  const allSessions = StorageManager.getSessions();

  const sorted = [...allSessions].sort((a, b) => b.start - a.start);
  const limited = sorted.slice(0, visibleCount);

  renderSessionsList(limited, nodeSessionsList, sessionHelpers);
}

function setupModalClose(modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

// lad more button:
const loadMoreBtn = document.getElementById('load-more');

loadMoreBtn.onclick = () => {
  const scrollTop = nodeSessionsList.scrollTop;

  visibleCount += 100;
  updateSessionsUI();

  nodeSessionsList.scrollTop = scrollTop;
};

// RESTORE:
window.addEventListener('load', () => {
  populateCategories();
  updateSessionsUI();

  const session = StorageManager.getActiveSession();

  if (session) {
    timer.classList.add('running');
    timerInstance.start(session.start);
  }

  updateToggleButton();
});

// REMOVE all the data:
const modalDeleteAll = document.getElementById('modal-delete-all');

document.getElementById('delete-button').onclick = () => {
  modalDeleteAll.classList.remove('hidden');
};

document.getElementById('cancel-delete-all').onclick = () => {
  modalDeleteAll.classList.add('hidden');
};

document.getElementById('confirm-delete-all').onclick = () => {
  StorageManager.clearAll();

  modalDeleteAll.classList.add('hidden');

  updateSessionsUI();
};

setupModalClose(modalDeleteAll);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modalDeleteAll.classList.add('hidden');
  }
});

const chartModal = document.getElementById('chart-modal');

document.getElementById('chart-button').onclick = () => {
  const sessions = StorageManager.getSessions();
  chartModal.classList.remove('hidden');
  renderChart(sessions);
};

chartModal.addEventListener('click', (e) => {
  if (e.target === chartModal) {
    chartModal.classList.add('hidden');
  }
});

// Export:
document.getElementById('export-button').onclick = exportData;

function exportData() {
  const data = JSON.stringify(StorageManager.getSessions(), null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'sessions.json';
  a.click();
}

// Import:
document.getElementById('import-button').onclick = () => {
  document.getElementById('import-input').click();
};

document.getElementById('import-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    importData(file);
  }
});

function importData(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);

      if (!Array.isArray(parsed) || parsed.some((s) => !s.start || !s.end)) {
        throw new Error('Invalid format');
      }
      if (!confirm('Replace current data?')) return;
      StorageManager.setSessions(parsed);

      updateSessionsUI();
    } catch (err) {
      alert('Invalid file');
    }
  };

  reader.readAsText(file);
}

// =====================================undo delete:
const undoToast = document.getElementById('undo-toast');
const undoBtn = document.getElementById('undo-btn');
const undoProgressBar = document.querySelector('.undo-progress');
const undoTextSpan = undoBtn.querySelector('span');

let pendingDeleteId = null;
let undoStartTime = null;
let undoDuration = 3000;
let undoRAF = null;

function handleDeleteWithUndo(id) {
  if (pendingDeleteId !== null) return;
  pendingDeleteId = id;

  showUndoToast();
  startUndoTimer();
}

function startUndoTimer() {
  cancelUndoTimer();

  undoStartTime = performance.now();

  function animate(now) {
    const elapsed = now - undoStartTime;
    const progress = Math.min(elapsed / undoDuration, 1);

    updateUndoProgress(progress);

    if (progress < 1) {
      undoRAF = requestAnimationFrame(animate);
    } else {
      finalizeDelete();
    }
  }

  undoRAF = requestAnimationFrame(animate);
}

function updateUndoProgress(progress) {
  // reduce from left to right:
  undoProgressBar.style.transform = `scaleX(${1 - progress})`;

  // text seconds:
  const secondsLeft = Math.ceil((undoDuration * (1 - progress)) / 1000);
  undoTextSpan.textContent = `Undo (${secondsLeft})`;
}

function cancelUndoTimer() {
  if (undoRAF) {
    cancelAnimationFrame(undoRAF);
    undoRAF = null;
  }
}

undoBtn.onclick = () => {
  cancelUndoTimer();
  pendingDeleteId = null;
  hideUndoToast();

  updateSessionsUI();
};

function finalizeDelete() {
  if (pendingDeleteId === null) return;

  const sessions = StorageManager.getSessions();
  const updated = sessions.filter((s) => s.start !== pendingDeleteId);

  StorageManager.setSessions(updated);

  pendingDeleteId = null;

  hideUndoToast();

  updateSessionsUI();
}

function showUndoToast() {
  undoToast.classList.remove('hidden');
  const bar = document.querySelector('.undo-progress');
  bar.style.transform = 'scaleX(1)';

  setTimeout(() => {
    undoToast.classList.add('show');
  }, 10);
}

function hideUndoToast() {
  undoToast.classList.remove('show');

  setTimeout(() => {
    undoToast.classList.add('hidden');
  }, 200);
}

initSwipe({
  container: nodeSessionsList,
  onSwipeDelete: (id) => {
    handleDeleteWithUndo(id);
  },
  constants: {
    SWIPE_THRESHOLD,
    SWIPE_LIMIT,
  },
});
