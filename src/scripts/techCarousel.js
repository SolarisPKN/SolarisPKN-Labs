export function initTechCarousel() {
  const track = document.getElementById('techCarouselTrack');
  const wrapper = document.getElementById('techCarouselWrapper');
  if (!track || !wrapper || wrapper.dataset.initialized === 'true') return () => {};

  wrapper.dataset.initialized = 'true';
  const controller = new AbortController();
  const { signal } = controller;

  Array.from(track.children).forEach((item) => {
    const clone = item.cloneNode(true);
    clone.dataset.carouselClone = 'true';
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  let currentTranslateX = 0;
  let isPaused = false;
  let isDragging = false;
  let startX = 0;
  let previousTranslateX = 0;
  let animationId;
  let resumeTimer;

  const setTranslateX = (value) => {
    currentTranslateX = value;
    track.style.transform = `translateX(${value}px)`;
  };

  const animate = () => {
    if (!isPaused && !isDragging) {
      currentTranslateX -= 0.5;
      const maxTranslate = -(track.scrollWidth / 2);
      if (currentTranslateX <= maxTranslate) currentTranslateX = 0;
      setTranslateX(currentTranslateX);
    }
    animationId = requestAnimationFrame(animate);
  };

  const startDrag = (clientX) => {
    isDragging = true;
    isPaused = true;
    startX = clientX;
    previousTranslateX = currentTranslateX;
    track.style.transition = 'none';
  };

  const moveDrag = (clientX) => {
    if (!isDragging) return;
    const minimum = -(track.scrollWidth / 2);
    const next = Math.max(minimum, Math.min(0, previousTranslateX + clientX - startX));
    setTranslateX(next);
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      isPaused = false;
    }, 1000);
  };

  wrapper.addEventListener('mousedown', (event) => startDrag(event.clientX), { signal });
  document.addEventListener('mousemove', (event) => moveDrag(event.clientX), { signal });
  document.addEventListener('mouseup', endDrag, { signal });
  wrapper.addEventListener('touchstart', (event) => startDrag(event.touches[0].clientX), { signal, passive: true });
  document.addEventListener('touchmove', (event) => moveDrag(event.touches[0].clientX), { signal, passive: true });
  document.addEventListener('touchend', endDrag, { signal });
  wrapper.addEventListener('mouseenter', () => { isPaused = true; }, { signal });
  wrapper.addEventListener('mouseleave', () => { if (!isDragging) isPaused = false; }, { signal });

  animationId = requestAnimationFrame(animate);

  return () => {
    controller.abort();
    cancelAnimationFrame(animationId);
    clearTimeout(resumeTimer);
    track.querySelectorAll('[data-carousel-clone]').forEach((clone) => clone.remove());
    track.style.transform = '';
    delete wrapper.dataset.initialized;
  };
}