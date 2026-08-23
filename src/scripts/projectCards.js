let activeController;

function setMetric(metric, value, fallback, locale) {
  if (!metric) return;

  const valueElement = metric.querySelector('[data-value]');
  if (!valueElement) return;

  if (value == null) {
    valueElement.textContent = fallback;
    metric.classList.add('unavailable');
    return;
  }

  valueElement.textContent =
    typeof value === 'number' ? value.toLocaleString(locale) : String(value);
  metric.classList.remove('unavailable');
}

function markCardUnavailable(card, message) {
  card.querySelectorAll('.metric').forEach((metric) => {
    setMetric(metric, null, message);
  });
}

async function loadCard(card, signal) {
  if (card.dataset.metricsInitialized === 'true') return;

  card.dataset.metricsInitialized = 'true';
  const lang = card.dataset.lang === 'en' ? 'en' : 'es';
  const locale = lang === 'es' ? 'es-AR' : 'en-US';
  const labels = lang === 'es'
    ? { noData: 'Sin datos', unavailable: 'No disponible', network: 'Error de red', performance: 'Rendimiento' }
    : { noData: 'No data', unavailable: 'Unavailable', network: 'Network error', performance: 'Performance' };

  const id = card.dataset.projectId?.toLowerCase();
  if (!id) {
    markCardUnavailable(card, labels.noData);
    return;
  }

  const stars = card.querySelector('[data-metric="stars"]');
  const commits = card.querySelector('[data-metric="commits"]');
  const third = card.querySelector('[data-metric="third"]');
  const thirdLabel = third?.querySelector('[data-label]');
  const thirdIcon = third?.querySelector('[data-icon]');

  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/SolarisPKN/SolarisPKN-Stats/main/${id}/Stats.json`,
      { signal },
    );

    if (response.status === 404) {
      markCardUnavailable(card, labels.noData);
      return;
    }

    if (!response.ok) {
      throw new Error(`Stats request failed with status ${response.status}`);
    }

    const data = await response.json();
    setMetric(stars, data.github?.stars, labels.unavailable, locale);
    setMetric(commits, data.github?.totalCommits, labels.unavailable, locale);

    if (data.cloudflare?.requests != null) {
      if (thirdIcon) thirdIcon.textContent = '🌐';
      if (thirdLabel) thirdLabel.textContent = lang === 'es' ? 'Solicitudes' : 'Requests';
      setMetric(third, data.cloudflare.requests, labels.unavailable, locale);
    } else if (data.pagespeed?.performance != null) {
      if (thirdIcon) thirdIcon.textContent = '⚡';
      if (thirdLabel) thirdLabel.textContent = labels.performance;
      setMetric(third, data.pagespeed.performance, labels.unavailable, locale);
    } else {
      setMetric(third, null, labels.unavailable, locale);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    markCardUnavailable(card, labels.network);
  }
}

function loadCardMetrics() {
  activeController?.abort();
  activeController = new AbortController();

  const cards = document.querySelectorAll('.project-card[data-project-id]');
  void Promise.all(
    Array.from(cards, (card) => loadCard(card, activeController.signal)),
  );
}

if (!window.__projectCardsListenersAttached) {
  window.__projectCardsListenersAttached = true;
  document.addEventListener('astro:page-load', loadCardMetrics);
  document.addEventListener('astro:before-swap', () => activeController?.abort());
}
