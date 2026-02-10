const categories = ['work', 'study', 'exercise', 'other'];

const elements = {
  timerNode: document.getElementById('timer'),
};















//timer:
let timeElapsed = 0;
let timerInterval;
let isRunning = false;

const startTimer = () => {
  // if (isRunning) return;
  isRunning = true;
  elements.timerNode.style.backgroundColor = colors.runningTimer;
  timerInterval = setInterval(() => {
    timeElapsed++;
    updateTimerDisplay(timeElapsed);
  }, 1000);
};

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  elements.timerNode.style.backgroundColor = colors.pausedTimer;
}

function updateTimerDisplay(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  document.getElementById('timer').textContent = `${padZero(minutes)}:${padZero(
    seconds
  )}`;
}

function padZero(number) {
  return number < 10 ? `0${number}` : number;
}

function resetTimer() {
  clearInterval(timerInterval);
  timeElapsed = 0;
  document.getElementById('timer').textContent = '00:00';
  elements.timerNode.style.backgroundColor = colors.runningTimer;
}


//5 timer:
elements.timerNode.addEventListener('click', () => {
  isRunning ? pauseTimer() : startTimer();
});