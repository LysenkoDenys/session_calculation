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

function updateButtons(state) {
  const start = document.getElementById("start-button");
  const stop = document.getElementById("stop-button");

  if (state === "idle") {
    start.disabled = false;
    stop.disabled = true;
  }

  if (state === "running") {
    start.disabled = true;
    stop.disabled = false;
  }
}

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

const getSessionsForDay = (sessionsList) => {
  const lastDay = getLastDay(sessionsList);
  return sessionsList.filter((el) => getDayformatDate(el.end) === lastDay);
};

function getTotal(sessionsOfDay) {
  return sessionsOfDay.reduce(
    (accumulator, currentValue) => accumulator + currentValue.duration,
    0,
  );
}

function getTotalDayTime() {
  const sessionsList = getSessions();
  if (sessionsList.length === 0) return "00:00:00";

  const sessionsOfDay = getSessionsForDay(sessionsList);

  const getTotalTime = getTotal(sessionsOfDay);
  return formatTime(getTotalTime);
}

function renderTotal() {
  const total = getTotalDayTime();

  nodeTotal.innerHTML = `Today: ${total} Yesterday: ${"todo"}`;
  nodeTotal.className = "total__info";
  // sessionItem.appendChild(divInfo);
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

//START:
document.getElementById("start-button").onclick = () => {
  const category = select.value || "other";
  const session = {
    start: Date.now(),
    category: category,
  };

  localStorage.setItem("activeSession", JSON.stringify(session));
  localStorage.setItem("lastCategory", category);
  timer.classList.add("running");

  startTimerUI(session.start);
  updateButtons("running");
};

//STOP:
document.getElementById("stop-button").onclick = () => {
  const session = JSON.parse(localStorage.getItem("activeSession"));

  if (!session) return;

  const end = Date.now();
  const duration = end - session.start;

  // session list:
  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

  sessions.push({
    ...session,
    end,
    duration,
  });

  localStorage.setItem("sessions", JSON.stringify(sessions));

  console.log("Session:", { ...session, end, duration });

  localStorage.removeItem("activeSession");
  timer.classList.remove("running");

  resetUI();
  renderTotal();
  populateSessions();
  updateButtons("idle");
};

// RESTORE:
window.addEventListener("load", () => {
  const session = JSON.parse(localStorage.getItem("activeSession"));
  populateCategories();
  populateSessions();

  if (session) {
    timer.classList.add("running");

    startTimerUI(session.start);
    updateButtons("running");
  } else {
    updateButtons("idle");
  }
});

console.log(formatDate(1774074291471));

// getLastDay(sessions)
// getSessionsForDay(sessions, day)
// getTotal(sessions)
