function initProjectExplainer() {
  document.querySelectorAll('.connectors-tabs').forEach((wrapper) => {
    const tabs = wrapper.querySelectorAll('[data-tab-index]');
    const panels = wrapper.querySelectorAll('[data-panel-index]');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panels.forEach(p => p.classList.toggle('active', p.dataset.panelIndex === tab.dataset.tabIndex));
      });
    });
  });
}
document.addEventListener('astro:page-load', initProjectExplainer);