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
    nodeSessionsList.appendChild(sessionItem);
  });
}

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
  <div>Cur: <span id=total__span>${total}</span></div>
  <div>Prev: <span id=prev__span>${prev}</span></div>
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

// REMOVE (todo: confirm window):
document.getElementById("delete-button").onclick = () => {
  alert("all the data will be deleted");
  localStorage.clear();
  renderTotal();
  populateSessions();
};

console.log(formatDate(1774074291471));
