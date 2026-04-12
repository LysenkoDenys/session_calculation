export function createTimer(display, formatTime) {
  let interval = null;

  function start(startTime) {
    clearInterval(interval);

    interval = setInterval(() => {
      const diff = Date.now() - startTime;
      display.textContent = formatTime(diff);
    }, 1000);
  }

  function stop() {
    clearInterval(interval);
  }

  function reset() {
    clearInterval(interval);
    display.textContent = "00:00:00";
  }

  return { start, stop, reset };
}
