function initScrollReveal() {
  window.__scrollRevealCleanup?.();

  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length === 0) {
    window.__scrollRevealCleanup = () => {};
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach((element) => element.classList.add('visible'));
    window.__scrollRevealCleanup = () => {};
    return;
  }

  reveals.forEach((element) => {
    element.classList.remove('visible');
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
  });

  let observer;
  const timerId = window.setTimeout(() => {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        entry.target.style.opacity = '';
        entry.target.style.transform = '';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach((element) => observer.observe(element));
  }, 150);

  window.__scrollRevealCleanup = () => {
    clearTimeout(timerId);
    observer?.disconnect();
    window.__scrollRevealCleanup = () => {};
  };
}

if (!window.__scrollRevealListenersAttached) {
  window.__scrollRevealListenersAttached = true;
  document.addEventListener('astro:page-load', initScrollReveal);
  document.addEventListener('astro:before-swap', () => window.__scrollRevealCleanup?.());
}