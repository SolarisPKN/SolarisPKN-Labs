function initProjectExplainer() {
  document.querySelectorAll('.connectors-tabs').forEach((wrapper) => {
    if (wrapper.dataset.tabsInitialized === 'true') return;
    wrapper.dataset.tabsInitialized = 'true';

    const tabs = Array.from(wrapper.querySelectorAll('[role="tab"][data-tab-index]'));
    const panels = Array.from(wrapper.querySelectorAll('[role="tabpanel"][data-panel-index]'));
    if (tabs.length === 0 || panels.length === 0) return;

    const activate = (selectedTab, moveFocus = false) => {
      tabs.forEach((tab) => {
        const selected = tab === selectedTab;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });

      panels.forEach((panel) => {
        const selected = panel.dataset.panelIndex === selectedTab.dataset.tabIndex;
        panel.classList.toggle('active', selected);
        panel.hidden = !selected;
      });

      if (moveFocus) selectedTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));

      tab.addEventListener('keydown', (event) => {
        let nextIndex;

        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex == null) return;

        event.preventDefault();
        activate(tabs[nextIndex], true);
      });
    });

    const initiallySelected = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0];
    activate(initiallySelected);
  });
}

if (!window.__projectExplainerListenersAttached) {
  window.__projectExplainerListenersAttached = true;
  document.addEventListener('astro:page-load', initProjectExplainer);
}