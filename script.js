const categories = ['work', 'study', 'exercise', 'other'];

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

const timer = document.getElementById('timer');
const display = document.getElementById('time-display');

document.getElementById('start-button').onclick = () => {
  if (!startTime) startTime = Date.now();

  timer.classList.remove('paused');
  timer.classList.add('running');

  interval = setInterval(() => {
    display.textContent = formatTime(Date.now() - startTime);
  }, 1000);
};

document.getElementById('pause-button').onclick = () => {
  clearInterval(interval);

  timer.classList.remove('running');
  timer.classList.add('paused');
};

document.getElementById('stop-button').onclick = () => {
  clearInterval(interval);

  timer.classList.remove('running', 'paused');

  display.textContent = '00:00:00';
  startTime = null;
};

// //timer:
// let timeElapsed = 0;
// let timerInterval;
// let isRunning = false;

// const startTimer = () => {
//   // if (isRunning) return;
//   isRunning = true;
//   elements.timerNode.style.backgroundColor = colors.runningTimer;
//   timerInterval = setInterval(() => {
//     timeElapsed++;
//     updateTimerDisplay(timeElapsed);
//   }, 1000);
// };

// function pauseTimer() {
//   if (!isRunning) return;
//   isRunning = false;
//   clearInterval(timerInterval);
//   elements.timerNode.style.backgroundColor = colors.pausedTimer;
// }

// function updateTimerDisplay(time) {
//   const minutes = Math.floor(time / 60);
//   const seconds = time % 60;
//   document.getElementById('timer').textContent = `${padZero(minutes)}:${padZero(
//     seconds,
//   )}`;
// }

// function padZero(number) {
//   return number < 10 ? `0${number}` : number;
// }

// function resetTimer() {
//   clearInterval(timerInterval);
//   timeElapsed = 0;
//   document.getElementById('timer').textContent = '00:00';
//   elements.timerNode.style.backgroundColor = colors.runningTimer;
// }

// //5 timer:
// elements.timerNode.addEventListener('click', () => {
//   isRunning ? pauseTimer() : startTimer();
// });
