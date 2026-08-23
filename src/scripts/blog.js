function initBlogFilters() {
  window.__blogFiltersCleanup?.();

  const buttons = document.querySelectorAll('.tag-filter');
  const cards = document.querySelectorAll('.post-card');
  if (buttons.length === 0) {
    window.__blogFiltersCleanup = () => {};
    return;
  }

  const controller = new AbortController();
  const { signal } = controller;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedTag = button.dataset.tag;

      buttons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle('active', selected);
        candidate.setAttribute('aria-pressed', String(selected));
        candidate.style.background = selected ? 'var(--border-cyan)' : 'transparent';
        candidate.style.color = selected ? '#0a0a0a' : 'var(--text-light)';
        candidate.style.borderColor = selected ? 'var(--border-cyan)' : 'rgba(255,255,255,0.2)';
      });

      cards.forEach((card) => {
        const tags = card.dataset.tags?.split(',') ?? [];
        card.style.display = selectedTag === 'all' || tags.includes(selectedTag) ? '' : 'none';
      });
    }, { signal });
  });

  window.__blogFiltersCleanup = () => {
    controller.abort();
    window.__blogFiltersCleanup = () => {};
  };
}

if (!window.__blogFiltersListenersAttached) {
  window.__blogFiltersListenersAttached = true;
  document.addEventListener('astro:page-load', initBlogFilters);
  document.addEventListener('astro:before-swap', () => window.__blogFiltersCleanup?.());
}