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

  toggleBtn: document.getElementById('toggle-button'),
  toggleIcon: document.getElementById('toggle-icon'),

  settingsBtn: document.getElementById('settings-button'),
  settingsMenu: document.getElementById('settings-menu'),

  loadMoreBtn: document.getElementById('load-more'),

  modalDeleteAll: document.getElementById('modal-delete-all'),
  chartModal: document.getElementById('chart-modal'),

  chartBtn: document.getElementById('chart-button'),

  deleteBtn: document.getElementById('delete-button'),
  cancelDeleteAllBtn: document.getElementById('cancel-delete-all'),
  confirmDeleteAllBtn: document.getElementById('confirm-delete-all'),

  exportBtn: document.getElementById('export-button'),
  importBtn: document.getElementById('import-button'),
  importInput: document.getElementById('import-input'),

  undoToast: document.getElementById('undo-toast'),
  undoBtn: document.getElementById('undo-btn'),
  undoProgressBar: document.querySelector('.undo-progress'),

  nodeSessionsList: document.getElementById('session-container'),
};

UI.undoTextSpan = UI.undoBtn?.querySelector('span');

const timerInstance = createTimer(UI.display, formatTime);

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

UI.settingsBtn.onclick = () => {
  UI.settingsMenu.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
  if (
    !UI.settingsMenu.contains(e.target) &&
    !UI.settingsBtn.contains(e.target)
  ) {
    UI.settingsMenu.classList.add('hidden');
  }
});

function isRunning() {
  return StorageManager.getActiveSession() !== null;
}

function updateToggleButton() {
  if (isRunning()) {
    UI.toggleBtn.classList.remove('start');
    UI.toggleBtn.classList.add('stop');
    UI.toggleIcon.className = 'fa-solid fa-stop';
  } else {
    UI.toggleBtn.classList.remove('stop');
    UI.toggleBtn.classList.add('start');
    UI.toggleIcon.className = 'fa-solid fa-play';
  }
}

UI.toggleBtn.onclick = () => {
  if (!isRunning()) {
    // START
    const category = UI.select.value || 'other';

    const session = {
      start: Date.now(),
      category,
    };

    StorageManager.setActiveSession(session);
    StorageManager.setLastCategory(category);

    UI.timer.classList.add('running');
    timerInstance.start(session.start);
  } else {
    // STOP
    const session = StorageManager.getActiveSession();
    const end = Date.now();
    const duration = end - session.start;

    const sessions = [...StorageManager.getSessions()];
    StorageManager.setSessions([...sessions, { ...session, end, duration }]);

    StorageManager.removeActiveSession();

    UI.timer.classList.remove('running');

    timerInstance.reset();
    updateSessionsUI();
  }

  updateToggleButton();
};

export function populateCategories() {
  UI.select.innerHTML = '';

  const lastCategory = StorageManager.getLastCategory();

  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;

    if (cat === lastCategory) {
      option.selected = true;
    }

    UI.select.appendChild(option);
  });
}

function updateSessionsUI() {
  const allSessions = StorageManager.getSessions();

  const sorted = [...allSessions].sort((a, b) => b.start - a.start);
  const limited = sorted.slice(0, visibleCount);

  renderSessionsList(limited, UI.nodeSessionsList, sessionHelpers);
}

function setupModalClose(modal) {
  if (!modal) return;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

// load more button:
UI.loadMoreBtn.onclick = () => {
  const scrollTop = UI.nodeSessionsList.scrollTop;

  visibleCount += 100;
  updateSessionsUI();

  UI.nodeSessionsList.scrollTop = scrollTop;
};

// RESTORE:
window.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  updateSessionsUI();

  const session = StorageManager.getActiveSession();

  if (session) {
    UI.timer.classList.add('running');
    timerInstance.start(session.start);
  }

  updateToggleButton();
});

// REMOVE all the data:
UI.deleteBtn.onclick = () => {
  UI.modalDeleteAll.classList.remove('hidden');
};

UI.cancelDeleteAllBtn.onclick = () => {
  UI.modalDeleteAll.classList.add('hidden');
};

UI.confirmDeleteAllBtn.onclick = () => {
  StorageManager.clearAll();

  UI.modalDeleteAll.classList.add('hidden');

  updateSessionsUI();
};

setupModalClose(UI.chartModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    UI.modalDeleteAll.classList.add('hidden');
  }
});

UI.chartBtn.onclick = () => {
  const sessions = StorageManager.getSessions();
  UI.chartModal.classList.remove('hidden');
  renderChart(sessions);
};

// Export:
UI.exportBtn.onclick = exportData;

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
UI.importBtn.onclick = () => {
  UI.importInput.click();
};

UI.importInput.addEventListener('change', (e) => {
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
// const undoToast = document.getElementById('undo-toast');
// const undoBtn = document.getElementById('undo-btn');
// const undoProgressBar = document.querySelector('.undo-progress');
// const undoTextSpan = undoBtn.querySelector('span');

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
  UI.undoProgressBar.style.transform = `scaleX(${1 - progress})`;

  // text seconds:
  const secondsLeft = Math.ceil((undoDuration * (1 - progress)) / 1000);
  if (UI.undoTextSpan) {
    UI.undoTextSpan.textContent = `Undo (${secondsLeft})`;
  }
}

function cancelUndoTimer() {
  if (undoRAF) {
    cancelAnimationFrame(undoRAF);
    undoRAF = null;
  }
}

UI.undoBtn.onclick = () => {
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
  UI.undoToast.classList.remove('hidden');
  const bar = UI.undoProgressBar;
  bar.style.transform = 'scaleX(1)';

  setTimeout(() => {
    UI.undoToast.classList.add('show');
  }, 10);
}

function hideUndoToast() {
  UI.undoToast.classList.remove('show');

  setTimeout(() => {
    UI.undoToast.classList.add('hidden');
  }, 200);
}

initSwipe({
  container: UI.nodeSessionsList,
  onSwipeDelete: (id) => {
    handleDeleteWithUndo(id);
  },
  constants: {
    SWIPE_THRESHOLD,
    SWIPE_LIMIT,
  },
});
