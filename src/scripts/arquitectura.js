let mermaidModule;
let configured = false;

async function initMermaid() {
  const nodes = document.querySelectorAll('.mermaid:not([data-processed])');
  if (nodes.length === 0) return;

  try {
    mermaidModule ??= import('mermaid').then(({ default: mermaid }) => mermaid);
    const mermaid = await mermaidModule;

    if (!configured) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        themeVariables: {
          background: '#0B0B10',
          primaryColor: '#1E1E2F',
          primaryBorderColor: '#00FFCC',
          lineColor: '#00FFCC',
          tertiaryColor: '#1E1E2F',
        },
      });
      configured = true;
    }

    await mermaid.run({ nodes });
  } catch (error) {
    console.warn('No se pudo renderizar el diagrama Mermaid.', error);
    nodes.forEach((node) => {
      node.style.display = 'block';
      node.style.whiteSpace = 'pre-wrap';
      node.dataset.processed = 'fallback';
    });
  }
}

if (!window.__mermaidListenersAttached) {
  window.__mermaidListenersAttached = true;
  document.addEventListener('astro:page-load', () => void initMermaid());

  if (document.readyState === 'complete') {
    void initMermaid();
  } else {
    window.addEventListener('load', () => void initMermaid(), { once: true });
  }
}