async function loadCardMetrics() {
  const isEs = document.documentElement.lang === 'es';
  const unavailableText = isEs ? 'Sin datos' : 'No data';

  const cards = document.querySelectorAll('.project-card[data-project-id]');
  await Promise.all(Array.from(cards).map(async (card) => {
    const id = card.dataset.projectId;
    const starsEl = card.querySelector('[data-metric="stars"] [data-value]');
    const commitsEl = card.querySelector('[data-metric="commits"] [data-value]');
    const third = card.querySelector('[data-metric="third"]');
    const thirdValue = third?.querySelector('[data-value]');
    const thirdLabel = third?.querySelector('[data-label]');
    const thirdIcon = third?.querySelector('[data-icon]');

    try {
      const res = await fetch(`https://raw.githubusercontent.com/SolarisPKN/SolarisPKN-Stats/main/${id}/Stats.json`);
      if (!res.ok) throw new Error('sin stats');
      const data = await res.json();

      if (starsEl) starsEl.textContent = data.github?.stars ?? unavailableText;
      if (commitsEl) commitsEl.textContent = data.github?.totalCommits ?? unavailableText;

      if (data.cloudflare?.requests != null) {
        thirdIcon.textContent = '🌐';
        thirdLabel.textContent = 'Requests';
        thirdValue.textContent = data.cloudflare.requests.toLocaleString();
      } else if (data.pagespeed?.performance != null) {
        thirdIcon.textContent = '⚡';
        thirdLabel.textContent = isEs ? 'Rendimiento' : 'Performance';
        thirdValue.textContent = data.pagespeed.performance;
      } else {
        third?.remove();
      }
    } catch {
      // No hay Stats.json para este proyecto (ej: firmware sin sitio web) → no es un error, es normal
      if (starsEl) starsEl.textContent = unavailableText;
      if (commitsEl) commitsEl.textContent = unavailableText;
      third?.remove();
      card.querySelectorAll('.metric').forEach(m => m.classList.add('unavailable'));
    }
  }));
}
document.addEventListener('astro:page-load', loadCardMetrics);