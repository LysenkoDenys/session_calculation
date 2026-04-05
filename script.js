const COLLAPSE_KEY = "collapsedDays";
const categories = ["work", "study", "exercise", "other"];
const colors = {
  work: "#4f46e5",
  study: "#4aed26",
  exercise: "#f97316",
  other: "#f0e112",
};
let startX = 0;
let startY = 0;
let currentItem = null;
let hasVibrated = false;

let interval = null;
const timer = document.getElementById("timer");
const display = document.getElementById("time-display");
const select = document.getElementById("category-select");
const nodeSessionsList = document.getElementById("session-container");
const nodeTotal = document.getElementById("total");
const settingsBtn = document.getElementById("settings-button");
const settingsMenu = document.getElementById("settings-menu");

// =====================================helpers:

function groupSessionsByDay(sessions) {
  const groups = {};

  sessions.forEach((s) => {
    const day = getDayformatDate(s.end);

    if (!groups[day]) {
      groups[day] = [];
    }

    groups[day].push(s);
  });

  return groups;
}

function setCollapsedState(state) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
}

function getCollapsedState() {
  return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {};
}

settingsBtn.onclick = () => {
  settingsMenu.classList.toggle("hidden");
};

document.addEventListener("click", (e) => {
  if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
    settingsMenu.classList.add("hidden");
  }
});

const StorageManager = {
  getActiveSession() {
    const session = localStorage.getItem("activeSession");
    return session ? JSON.parse(session) : null;
  },
  setActiveSession(session) {
    localStorage.setItem("activeSession", JSON.stringify(session));
  },
  removeActiveSession() {
    localStorage.removeItem("activeSession");
  },
  getSessions() {
    return JSON.parse(localStorage.getItem("sessions") || "[]");
  },
  setSessions(sessions) {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  },
  clearAll() {
    localStorage.clear();
  },
  getLastCategory() {
    return localStorage.getItem("lastCategory") || "other";
  },
  setLastCategory(category) {
    localStorage.setItem("lastCategory", category);
  },
};

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatCurrentTime(ms) {
  const date = new Date(ms);

  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function formatDate(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const date = new Date(ms);

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d}_${h}:${m}:${s}`;
}

function getDayformatDate(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const date = new Date(ms);

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

const toggleBtn = document.getElementById("toggle-button");
const toggleIcon = document.getElementById("toggle-icon");

function isRunning() {
  return !!StorageManager.getActiveSession();
}

function updateToggleButton() {
  if (isRunning()) {
    toggleBtn.classList.remove("start");
    toggleBtn.classList.add("stop");
    toggleIcon.className = "fa-solid fa-stop";
  } else {
    toggleBtn.classList.remove("stop");
    toggleBtn.classList.add("start");
    toggleIcon.className = "fa-solid fa-play";
  }
}

toggleBtn.onclick = () => {
  if (!isRunning()) {
    // START
    const category = select.value || "other";

    const session = {
      start: Date.now(),
      category,
    };

    StorageManager.setActiveSession(session);
    StorageManager.setLastCategory(category);

    timer.classList.add("running");
    startTimerUI(session.start);
  } else {
    // STOP
    const session = StorageManager.getActiveSession();
    const end = Date.now();
    const duration = end - session.start;

    const sessions = StorageManager.getSessions();
    StorageManager.setSessions([...sessions, { ...session, end, duration }]);

    StorageManager.removeActiveSession();

    timer.classList.remove("running");

    resetUI();
    populateSessions();
  }

  updateToggleButton();
};

function populateCategories() {
  select.innerHTML = "";

  const lastCategory = StorageManager.getLastCategory();

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;

    if (cat === lastCategory) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

function resetSwipe() {
  if (!currentItem) return;

  currentItem.style.transform = "translateX(0)";
  currentItem.style.opacity = "1";

  currentItem = null;
  hasVibrated = false;
}

function populateSessions() {
  nodeSessionsList.innerHTML = "";

  const collapsedState = getCollapsedState();
  const sessionsList = StorageManager.getSessions();
  const grouped = groupSessionsByDay(sessionsList);

  const sortedDays = Object.keys(grouped).sort().reverse();

  sortedDays.forEach((day) => {
    const dayGroup = document.createElement("div");
    dayGroup.className = "day-group";

    // 📅 header of the day:
    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    dayHeader.onclick = () => {
      const state = getCollapsedState();

      wrapper.classList.toggle("collapsed");

      const isNowCollapsed = wrapper.classList.contains("collapsed");

      state[day] = isNowCollapsed;
      setCollapsedState(state);

      const label = dayHeader.querySelector(".day-label");
      label.textContent = isNowCollapsed ? "▶ " + day : "▼ " + day;
    };

    // 📊 total for the day:
    const total = getTotal(grouped[day]);

    dayHeader.innerHTML = `
    <span>▼ ${day}</span>
    <span class="day-total">${formatTime(total)}</span>
  `;

    // 📂 wrapper for sessions:
    const wrapper = document.createElement("div");
    wrapper.className = "day-sessions";

    const isCollapsed = collapsedState[day];

    if (isCollapsed) {
      wrapper.classList.add("collapsed");
      wrapper.style.height = "0px";
    }

    grouped[day]
      .sort((a, b) => b.start - a.start)
      .forEach((item) => {
        const sessionItem = document.createElement("div");
        sessionItem.className = "session-item";
        sessionItem.dataset.id = item.start;

        const topRow = document.createElement("div");
        topRow.className = "session-item__top";

        const divCategory = document.createElement("div");
        divCategory.innerHTML = `${item.category}:`;
        divCategory.className = "session-item__category";

        const divDur = document.createElement("div");
        divDur.innerHTML = `${formatTime(item.duration)}`;
        divDur.className = "session-item__duration";

        topRow.appendChild(divCategory);
        topRow.appendChild(divDur);

        const divInfo = document.createElement("div");
        divInfo.innerHTML = `${formatCurrentTime(item.start)} - ${formatCurrentTime(item.end)}`;
        divInfo.className = "session-item__info";

        sessionItem.appendChild(divCategory);
        sessionItem.appendChild(divInfo);
        sessionItem.appendChild(topRow);

        wrapper.appendChild(sessionItem);
      });

    dayGroup.appendChild(dayHeader);
    dayGroup.appendChild(wrapper);

    nodeSessionsList.appendChild(dayGroup);
  });
}

function setupModalClose(modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

function getTotal(sessionsOfDay) {
  return sessionsOfDay.reduce(
    (accumulator, currentValue) => accumulator + currentValue.duration,
    0,
  );
}

// UI timer:
function startTimerUI(startTime) {
  clearInterval(interval);

  interval = setInterval(() => {
    const diff = Date.now() - startTime;
    display.textContent = formatTime(diff);
  }, 1000);
}

function resetUI() {
  clearInterval(interval);
  display.textContent = "00:00:00";
}

// RESTORE:
window.addEventListener("load", () => {
  populateCategories();
  populateSessions();

  const session = StorageManager.getActiveSession();

  if (session) {
    timer.classList.add("running");
    startTimerUI(session.start);
  }

  updateToggleButton();
});

// REMOVE all the data:
const modalDeleteAll = document.getElementById("modal-delete-all");

document.getElementById("delete-button").onclick = () => {
  modalDeleteAll.classList.remove("hidden");
};

document.getElementById("cancel-delete-all").onclick = () => {
  modalDeleteAll.classList.add("hidden");
};

document.getElementById("confirm-delete-all").onclick = () => {
  StorageManager.clearAll();

  modalDeleteAll.classList.add("hidden");

  populateSessions();
};

setupModalClose(modalDeleteAll);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modalDeleteAll.classList.add("hidden");
  }
});

// 📊 CHART:

function getLast7Days() {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const formatted = getDayformatDate(d.getTime());
    days.push(formatted);
  }

  return days;
}

function getDailyTotals() {
  const sessions = StorageManager.getSessions();
  const map = {};
  sessions.forEach((s) => {
    const day = getDayformatDate(s.end);
    map[day] = (map[day] || 0) + s.duration;
  });
  return map;
}

function getChartData() {
  const totals = getDailyTotals();
  const days = getLast7Days();

  const labels = days.map((d) => d.slice(5)); // MM-DD
  const values = days.map((d) => Math.floor((totals[d] || 0) / 1000 / 60));

  return { labels, values };
}

function createGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);

  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + "CC");

  return gradient;
}

let chart;

function renderChart() {
  const { labels, datasets } = getStackedChartData();

  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  if (chart) chart.destroy();

  // 🔥 додаємо gradient до кожного dataset
  datasets.forEach((ds) => {
    ds.backgroundColor = createGradient(ctx, ds.backgroundColor);
  });

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: 10,
      },

      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },

      plugins: {
        legend: {
          labels: {
            color: "#ccc",
            font: {
              size: 10,
              weight: "600",
            },
            padding: 10,
            usePointStyle: true,
            pointStyle: "rect",
          },
        },

        tooltip: {
          backgroundColor: "rgba(20,20,20,0.9)",
          titleColor: "#fff",
          bodyColor: "#aaa",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          displayColors: false,

          callbacks: {
            title: (items) => `Day: ${items[0].label}`,
            label: (context) => {
              return `${context.dataset.label}: ${context.raw} min`;
            },
          },
        },
      },

      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: "#aaa",
            font: {
              size: 8,
              weight: "600",
            },
            padding: 5,
          },
        },

        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: "rgba(255,255,255,0.03)",
          },
          ticks: {
            color: "#888",
            callback: (v) => v + "m",
          },
        },
      },
    },
  });
}

const chartModal = document.getElementById("chart-modal");

document.getElementById("chart-button").onclick = () => {
  chartModal.classList.remove("hidden");
  renderChart();
};

chartModal.addEventListener("click", (e) => {
  if (e.target === chartModal) {
    chartModal.classList.add("hidden");
  }
});

// Export:
document.getElementById("export-button").onclick = exportData;

function exportData() {
  const data = JSON.stringify(StorageManager.getSessions(), null, 2);

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "sessions.json";
  a.click();
}

// Import:
document.getElementById("import-button").onclick = () => {
  document.getElementById("import-input").click();
};

document.getElementById("import-input").addEventListener("change", (e) => {
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

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid format");
      }
      if (!confirm("Replace current data?")) return;
      StorageManager.setSessions(parsed);

      populateSessions();
    } catch (err) {
      alert("Invalid file");
    }
  };

  reader.readAsText(file);
}

// =====================================new chart with categories:
function getDailyByCategory() {
  const sessions = StorageManager.getSessions();
  const map = {};

  sessions.forEach((s) => {
    const day = getDayformatDate(s.end);
    let category = s.category;

    if (!map[day]) {
      map[day] = {};
    }

    if (!map[day][category]) {
      map[day][category] = 0;
    }

    map[day][category] += s.duration;
  });

  return map;
}

function getStackedChartData() {
  const data = getDailyByCategory();
  const days = getLast7Days();

  const datasets = categories.map((cat) => {
    return {
      label: cat,
      backgroundColor: colors[cat],
      barThickness: 25,
      data: days.map((day) => Math.floor((data[day]?.[cat] || 0) / 1000 / 60)),
    };
  });

  const labels = days.map((d) => d.slice(5)); // MM-DD

  return { labels, datasets };
}

// =====================================left swipe:
const SWIPE_THRESHOLD = -40;
const SWIPE_LIMIT = -30;

nodeSessionsList.addEventListener("touchstart", (e) => {
  const item = e.target.closest(".session-item");
  if (!item) return;

  currentItem = item;

  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;

  currentItem.style.transition = "none";
});
nodeSessionsList.addEventListener("touchmove", (e) => {
  if (!currentItem) return;

  const moveX = e.touches[0].clientX;
  const diffX = moveX - startX;

  if (diffX < 0) {
    const limitedX =
      diffX < SWIPE_LIMIT ? SWIPE_LIMIT + (diffX - SWIPE_LIMIT) * 0.2 : diffX;
    currentItem.style.transform = `translateX(${limitedX}px)`;

    const opacity = 1 + limitedX / 200;
    currentItem.style.opacity = opacity;
  }

  if (diffX < SWIPE_THRESHOLD && !hasVibrated) {
    navigator.vibrate?.(30);
    hasVibrated = true;
  }
});
nodeSessionsList.addEventListener("touchend", (e) => {
  if (!currentItem) return;

  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;

  const diffX = endX - startX;
  const diffY = endY - startY;

  currentItem.style.transition = "transform 0.2s ease";

  if (Math.abs(diffY) > 30) {
    resetSwipe();
    return;
  }

  if (diffX < SWIPE_THRESHOLD) {
    currentItem.style.transform = "translateX(-100%)";
    currentItem.style.height = currentItem.offsetHeight + "px";
    currentItem.style.overflow = "hidden";

    const id = Number(currentItem.dataset.id);

    setTimeout(() => {
      const sessions = StorageManager.getSessions();
      const session = sessions.find((s) => s.start === id);

      if (session) {
        handleDeleteWithUndo(session);
      }
      currentItem.style.transition = "height 0.2s ease";
      currentItem.style.height = "0px";
      resetSwipe();
    }, 150);
  } else {
    resetSwipe();
  }
});

// =====================================undo delete:
const undoToast = document.getElementById("undo-toast");
const undoBtn = document.getElementById("undo-btn");

let pendingDelete = null;
let undoStartTime = null;
let undoDuration = 3000;
let undoRAF = null;

function handleDeleteWithUndo(session) {
  pendingDelete = session;

  showUndoToast();
  startUndoTimer();
}

function startUndoTimer() {
  cancelUndoTimer(); // на всякий

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
  const bar = document.querySelector(".undo-progress");

  // зменшується зліва направо
  bar.style.transform = `scaleX(${1 - progress})`;

  // (опціонально) текст секунд
  const secondsLeft = Math.ceil((undoDuration * (1 - progress)) / 1000);
  const textSpan = undoBtn.querySelector("span");
  textSpan.textContent = `Undo (${secondsLeft})`;
}

function cancelUndoTimer() {
  if (undoRAF) {
    cancelAnimationFrame(undoRAF);
    undoRAF = null;
  }
}

undoBtn.onclick = () => {
  cancelUndoTimer();
  pendingDelete = null;
  hideUndoToast();

  populateSessions();
};

function finalizeDelete() {
  if (!pendingDelete) return;

  const sessions = StorageManager.getSessions();
  const updated = sessions.filter((s) => s.start !== pendingDelete.start);

  StorageManager.setSessions(updated);

  pendingDelete = null;

  hideUndoToast();

  populateSessions();
}

function showUndoToast() {
  undoToast.classList.remove("hidden");
  const bar = document.querySelector(".undo-progress");
  bar.style.transform = "scaleX(1)";

  setTimeout(() => {
    undoToast.classList.add("show");
  }, 10);
}

function hideUndoToast() {
  undoToast.classList.remove("show");

  setTimeout(() => {
    undoToast.classList.add("hidden");
  }, 200);
}
