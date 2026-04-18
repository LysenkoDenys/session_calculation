export function initSwipe({ container, onSwipeDelete, constants }) {
  let startX = 0;
  let startY = 0;
  let currentItem = null;
  let hasVibrated = false;

  function resetSwipe() {
    if (!currentItem) return;

    currentItem.style.transform = 'translateX(0)';
    currentItem.style.opacity = '1';

    currentItem = null;
    hasVibrated = false;
  }

  const { SWIPE_THRESHOLD, SWIPE_LIMIT } = constants;

  // =====================================left swipe:
  container.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.session-item');
    if (!item) return;

    currentItem = item;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;

    currentItem.style.transition = 'none';
  });
  container.addEventListener('touchmove', (e) => {
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
  container.addEventListener('touchend', (e) => {
    if (!currentItem) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = endX - startX;
    const diffY = endY - startY;

    currentItem.style.transition = 'transform 0.2s ease';

    if (Math.abs(diffY) > 30) {
      resetSwipe();
      return;
    }

    if (diffX < SWIPE_THRESHOLD) {
      currentItem.style.transform = 'translateX(-100%)';
      currentItem.style.height = currentItem.offsetHeight + 'px';
      currentItem.style.overflow = 'hidden';

      const id = Number(currentItem.dataset.id);
      if (Number.isNaN(id)) return;

      setTimeout(() => {
        onSwipeDelete(id);
        currentItem.style.transition = 'height 0.2s ease';
        currentItem.style.height = '0px';
        resetSwipe();
      }, 150);
    } else {
      resetSwipe();
    }
  });
}
