// src/scripts/techCarousel.js
export function initTechCarousel() {
  const track = document.getElementById('techCarouselTrack');
  const wrapper = document.getElementById('techCarouselWrapper');
  if (!track || !wrapper) return;

  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  let currentTranslateX = 0;
  let speed = 0.5;
  let isPaused = false;
  let isDragging = false;
  let startX = 0;
  let prevTranslateX = 0;
  let animationId = null;

  function setTranslateX(value) {
    currentTranslateX = value;
    track.style.transform = `translateX(${value}px)`;
  }

  function animate() {
    if (isPaused || isDragging) {
      animationId = requestAnimationFrame(animate);
      return;
    }
    currentTranslateX -= speed;
    const maxTranslate = -(track.scrollWidth / 2);
    if (currentTranslateX <= maxTranslate) {
      currentTranslateX = 0;
    }
    setTranslateX(currentTranslateX);
    animationId = requestAnimationFrame(animate);
  }

  wrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    isPaused = true;
    startX = e.clientX;
    prevTranslateX = currentTranslateX;
    track.style.transition = 'none';
    if (animationId) cancelAnimationFrame(animationId);
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    let newX = prevTranslateX + diff;
    const maxX = 0;
    const minX = -(track.scrollWidth / 2);
    if (newX > maxX) newX = maxX;
    if (newX < minX) newX = minX;
    setTranslateX(newX);
  });
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      setTimeout(() => {
        isPaused = false;
        if (!animationId) animate();
      }, 1000);
    }
  });

  wrapper.addEventListener('touchstart', (e) => {
    isDragging = true;
    isPaused = true;
    startX = e.touches[0].clientX;
    prevTranslateX = currentTranslateX;
    track.style.transition = 'none';
    if (animationId) cancelAnimationFrame(animationId);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    let newX = prevTranslateX + diff;
    const maxX = 0;
    const minX = -(track.scrollWidth / 2);
    if (newX > maxX) newX = maxX;
    if (newX < minX) newX = minX;
    setTranslateX(newX);
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      setTimeout(() => {
        isPaused = false;
        if (!animationId) animate();
      }, 1000);
    }
  }, { passive: true });

  wrapper.addEventListener('mouseenter', () => { isPaused = true; });
  wrapper.addEventListener('mouseleave', () => {
    isPaused = false;
    if (!animationId) animate();
  });

  animate();

  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
  });
}