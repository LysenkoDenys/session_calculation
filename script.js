const categories = ["work", "study", "exercise", "other"];

let interval = null;
const timer = document.getElementById("timer");
const display = document.getElementById("time-display");
const select = document.getElementById("category-select");
const nodeSessionsList = document.getElementById("session-container");
const nodeTotal = document.getElementById("total");

// helpers:
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
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
  return !!localStorage.getItem("activeSession");
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

    localStorage.setItem("activeSession", JSON.stringify(session));
    localStorage.setItem("lastCategory", category);

    timer.classList.add("running");
    startTimerUI(session.start);
  } else {
    // STOP
    const session = JSON.parse(localStorage.getItem("activeSession"));
    const end = Date.now();
    const duration = end - session.start;

    const sessions = getSessions();

    sessions.push({ ...session, end, duration });
    localStorage.setItem("sessions", JSON.stringify(sessions));
    localStorage.removeItem("activeSession");

    timer.classList.remove("running");

    resetUI();
    renderTotal();
    populateSessions();
  }

  updateToggleButton();
};

function populateCategories() {
  select.innerHTML = "";

  const lastCategory = localStorage.getItem("lastCategory") || "other";

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

function populateSessions() {
  nodeSessionsList.innerHTML = "";

  const sessionsList = JSON.parse(localStorage.getItem("sessions") || "[]");

  [...sessionsList].reverse().forEach((item) => {
    const sessionItem = document.createElement("div");
    sessionItem.className = "session-item";
    const topRow = document.createElement("div");
    topRow.className = "session-item__top";
    const divCategory = document.createElement("div");
    divCategory.innerHTML = `${item.category}:`;
    divCategory.className = "session-item__category";
    topRow.appendChild(divCategory);
    sessionItem.appendChild(topRow);

    const divInfo = document.createElement("div");
    divInfo.innerHTML = `${formatDate(item.start)} - ${formatDate(item.end)}`;
    divInfo.className = "session-item__info";
    sessionItem.appendChild(divInfo);

    const divDur = document.createElement("div");
    divDur.innerHTML = `${formatTime(item.duration)}`;
    divDur.className = "session-item__duration";
    topRow.appendChild(divDur);

    // delete the item by left swipe:
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let hasVibrated = false;

    sessionItem.addEventListener("touchmove", (e) => {
      const moveX = e.touches[0].clientX;
      currentX = moveX - startX;

      //move left only + constraint:
      if (currentX < 0) {
        const limitedX = Math.max(currentX, -100);
        sessionItem.style.transform = `translateX(${limitedX}px)`;
        // opacity effect:
        const opacity = 1 + limitedX / 200;
        sessionItem.style.opacity = opacity;
      }
      // vibration:
      if (currentX < -80 && !hasVibrated) {
        navigator.vibrate?.(30);
        hasVibrated = true;
      }
    });

    sessionItem.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      sessionItem.style.transition = "none";
    });

    sessionItem.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      // return animation
      sessionItem.style.transition = "transform 0.2s ease";

      // якщо це не горизонтальний свайп → просто назад
      if (Math.abs(diffY) > 30) {
        sessionItem.style.transform = "translateX(0)";
        sessionItem.style.opacity = "1";
        hasVibrated = false; // ✅
        return;
      }

      // swipe enougth:
      if (diffX < -80) {
        sessionItem.style.transform = "translateX(-100%)";
        sessionItem.style.opacity = "1";

        // невелика затримка для ефекту
        setTimeout(() => {
          openDeleteModal(item);
          sessionItem.style.transform = "translateX(0)";
        }, 150);
      } else {
        // wipe is not enougth --> backward:
        sessionItem.style.transform = "translateX(0)";
        sessionItem.style.opacity = "1";
      }
      hasVibrated = false;
    });
    nodeSessionsList.appendChild(sessionItem);
  });
}

// DELETE one session:
const modalDeleteOne = document.getElementById("modal-delete-one");
let sessionToDelete = null;

function openDeleteModal(session) {
  sessionToDelete = session;
  modalDeleteOne.classList.remove("hidden");
}

document.getElementById("confirm-delete-one").onclick = () => {
  if (!sessionToDelete) return;

  const sessions = getSessions();

  const updated = sessions.filter((s) => s.start !== sessionToDelete.start);

  localStorage.setItem("sessions", JSON.stringify(updated));

  sessionToDelete = null;

  modalDeleteOne.classList.add("hidden");

  populateSessions();
  renderTotal();
};

document.getElementById("cancel-delete-one").onclick = () => {
  modalDeleteOne.classList.add("hidden");
};

function setupModalClose(modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

setupModalClose(modalDeleteOne);

// =========================================================================

const getSessions = () => JSON.parse(localStorage.getItem("sessions") || "[]");

const getLastDay = (sessionsList) =>
  getDayformatDate(Math.max(...sessionsList.map((el) => el.end)));

const getSessionsForDay = (sessionsList, day) => {
  return sessionsList.filter((el) => getDayformatDate(el.end) === day);
};

function getTotal(sessionsOfDay) {
  return sessionsOfDay.reduce(
    (accumulator, currentValue) => accumulator + currentValue.duration,
    0,
  );
}

// Total time of the last session day:
function getTotalDayTime() {
  const sessionsList = getSessions();
  if (sessionsList.length === 0) return "00:00:00";
  const day = getLastDay(sessionsList);

  const sessionsOfDay = getSessionsForDay(sessionsList, day);

  const getTotalTime = getTotal(sessionsOfDay);
  return formatTime(getTotalTime);
}

// THE PREV DAY:
const getLastPrevDay = () => {
  const sessionsList = getSessions();
  const daysOfSessions = Array.from(
    new Set(sessionsList.map((el) => getDayformatDate(el.end))),
  );
  if (sessionsList.length === 0) return "00:00:00";
  if (daysOfSessions.length < 2) return "00:00:00";

  return daysOfSessions.sort().reverse()[1];
};

// Total time of the previous session day:
function getTotalPrevDayTime() {
  const sessionsList = getSessions();
  if (sessionsList.length === 0) return "00:00:00";

  const prevDay = getLastPrevDay();
  if (!prevDay) return "00:00:00";

  const sessionsOfPrevDay = getSessionsForDay(sessionsList, prevDay);

  const getTotalTime = getTotal(sessionsOfPrevDay);
  return formatTime(getTotalTime);
}

function renderTotal() {
  const total = getTotalDayTime();
  const prev = getTotalPrevDayTime();

  nodeTotal.innerHTML = `
  <div class='total__info_1'> <span class="total__span_1">Current: </span> <span class="total__span_2">${total}</span></div>
   <div class='total__info_2'> <span class="prev__span_1">Previous: </span> <span class="prev__span_2">${prev}</span></div>
`;
  nodeTotal.className = "total__info";
}

renderTotal();

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

  const session = JSON.parse(localStorage.getItem("activeSession"));

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
  localStorage.clear();

  modalDeleteAll.classList.add("hidden");

  populateSessions();
  renderTotal();
};

setupModalClose(modalDeleteAll);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modalDeleteAll.classList.add("hidden");
    modalDeleteOne.classList.add("hidden");
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
  const sessions = getSessions();
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

let chart;

function renderChart() {
  const { labels, values } = getChartData();

  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Minutes",
          data: values,

          // 🎨 бари
          backgroundColor: labels.map((_, i) =>
            i === labels.length - 1 ? "#eaed26" : "#4f46e5",
          ),
          borderRadius: 5,
          barThickness: 20,

          // hover ефект
          hoverBackgroundColor: "#6366f1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: 10,
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "#111",
          titleColor: "#fff",
          bodyColor: "#ccc",
          borderColor: "#333",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,

          callbacks: {
            label: function (context) {
              return `${context.raw} min`;
            },
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#bcbcbc",
            font: {
              size: 12,
            },
          },
        },

        y: {
          beginAtZero: true,

          grid: {
            color: "rgba(255,255,255,0.05)",
          },

          ticks: {
            color: "#bcbcbc",
            callback: function (value) {
              return value + "m";
            },
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
  const data = JSON.stringify(getSessions(), null, 2);

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
      localStorage.setItem("sessions", JSON.stringify(parsed));

      populateSessions();
      renderTotal();
    } catch (err) {
      alert("Invalid file");
    }
  };

  reader.readAsText(file);
}
