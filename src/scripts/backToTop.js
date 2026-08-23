export function initBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button || button.dataset.initialized === 'true') return () => {};

  button.dataset.initialized = 'true';
  const controller = new AbortController();
  const { signal } = controller;

  const updateVisibility = () => {
    button.style.display = window.scrollY > 300 ? 'flex' : 'none';
  };

  window.addEventListener('scroll', updateVisibility, { signal, passive: true });
  button.addEventListener(
    'click',
    () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    { signal },
  );
  updateVisibility();

  return () => {
    controller.abort();
    delete button.dataset.initialized;
  };
}