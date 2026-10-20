function initBlogFilters() {
  window.__blogFiltersCleanup?.();

  const buttons = document.querySelectorAll('.tag-filter');
  const cards = document.querySelectorAll('.post-card-link');
  const counter = document.querySelector('[data-blog-result-count]');
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
      });

      let visible = 0;
      cards.forEach((card) => {
        const tags = card.dataset.tags?.split(',') ?? [];
        const matches = selectedTag === 'all' || tags.includes(selectedTag);
        card.hidden = !matches;
        if (matches) visible++;
      });
      if (counter) counter.textContent = visible + ' ' + (counter.dataset.resultsLabel || 'posts');
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