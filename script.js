const categories = ['work', 'study', 'exercise', 'other'];

let interval = null;
const timer = document.getElementById('timer');
const display = document.getElementById('time-display');

// helpers:
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function updateButtons(state) {
  const start = document.getElementById('start-button');
  const stop = document.getElementById('stop-button');

  if (state === 'idle') {
    start.disabled = false;
    stop.disabled = true;
  }

  if (state === 'running') {
    start.disabled = true;
    stop.disabled = false;
  }
}
// //tim
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
  display.textContent = '00:00:00';
}

document.getElementById('start-button').addEventListener('click', () => {
  console.log('START clicked');

  const fakeStart = Date.now();
  startTimerUI(fakeStart);

  updateButtons('running');
});

document.getElementById('stop-button').addEventListener('click', () => {
  console.log('STOP clicked');

  resetUI();
  updateButtons('idle');
});
