    // Inicializar Mermaid después de cada navegación
    async function initMermaid() {
      // Si ya existe, limpiar versiones anteriores
      const mermaidPre = document.querySelector('.mermaid');
      if (!mermaidPre) return;

      // Eliminar posibles instancias previas de Mermaid
      const wrapper = mermaidPre.parentElement;
      const clone = mermaidPre.cloneNode(true);
      wrapper.replaceChild(clone, mermaidPre);

      // Importar y ejecutar Mermaid
      const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
      mermaid.initialize({ startOnLoad: true, theme: 'dark', themeVariables: { background: '#0B0B10' } });
      await mermaid.run({ nodes: [clone] });
    }

    // Ejecutar al cargar la página y en cada navegación
    document.addEventListener('astro:page-load', initMermaid);