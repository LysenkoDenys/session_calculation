export function groupSessionsByDay(sessions) {
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

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function formatCurrentTime(ms) {
  const date = new Date(ms);

  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

export function getDayformatDate(ms) {
  const date = new Date(ms);

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function getTotal(sessionsOfDay) {
  return sessionsOfDay.reduce(
    (accumulator, currentValue) => accumulator + currentValue.duration,
    0,
  );
}
