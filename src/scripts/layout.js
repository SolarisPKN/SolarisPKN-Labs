function initLanguageSelector() {
  window.__languageSelectorCleanup?.();

  const button = document.getElementById('lang-btn');
  const dropdown = document.getElementById('lang-dropdown');
  if (!button || !dropdown) {
    window.__languageSelectorCleanup = () => {};
    return;
  }

  const controller = new AbortController();
  const { signal } = controller;

  const close = () => {
    dropdown.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const expanded = dropdown.classList.toggle('active');
    button.setAttribute('aria-expanded', String(expanded));
  }, { signal });

  document.addEventListener('click', (event) => {
    if (!button.contains(event.target) && !dropdown.contains(event.target)) close();
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  }, { signal });

  window.__languageSelectorCleanup = () => {
    controller.abort();
    window.__languageSelectorCleanup = () => {};
  };
}

if (!window.__languageSelectorListenersAttached) {
  window.__languageSelectorListenersAttached = true;
  document.addEventListener('astro:page-load', initLanguageSelector);
  document.addEventListener('astro:before-swap', () => window.__languageSelectorCleanup?.());
}