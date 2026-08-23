function initHome() {
  window.__homeCleanup?.();

  const controller = new AbortController();
  const { signal } = controller;
  const canvas = document.getElementById('chip-canvas');
  const counter = document.getElementById('chip-counter');
  const earlyAccess = document.getElementById('early-bait');
  let timerId;
  let startTimerId;
  let animationId;
  let idleId;
  let running = true;

  if (canvas && counter) {
    const context = canvas.getContext('2d');
    let count = 0;
    const maximum = 20;

    const drawChips = (amount) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const total = Math.min(amount, maximum);
      for (let index = 0; index < total; index += 1) {
        context.fillStyle = `hsl(${Date.now() / 20 + index * 30}, 100%, 60%)`;
        context.beginPath();
        context.arc(20 + (index % 20) * 38, 50 + Math.floor(index / 20) * 50, 12, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'white';
        context.font = '10px monospace';
        context.fillText(`ESP${index}`, 12 + (index % 20) * 38, 54 + Math.floor(index / 20) * 50);
      }
    };

    const update = () => {
      if (!running) return;
      count = Math.min(maximum, count + Math.floor(Math.random() * 3));
      counter.textContent = String(count);
      drawChips(count);
      timerId = window.setTimeout(() => {
        animationId = requestAnimationFrame(update);
      }, 2500);
    };

    const start = () => {
      startTimerId = window.setTimeout(() => {
        drawChips(0);
        update();
      }, 1000);
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      start();
    }

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (!running) {
        clearTimeout(timerId);
        cancelAnimationFrame(animationId);
      } else {
        update();
      }
    }, { signal });
  }

  if (earlyAccess) {
    const messages = {
      message: earlyAccess.dataset.message || '📧 Dejame tu correo y te aviso cuando lance Early Access:',
      success: earlyAccess.dataset.success || '✅ Gracias! Te avisaremos pronto. (demo sin backend)',
      invalid: earlyAccess.dataset.invalid || 'Correo inválido',
    };

    earlyAccess.addEventListener('click', () => {
      const email = window.prompt(messages.message);
      if (email?.includes('@')) window.alert(messages.success);
      else if (email) window.alert(messages.invalid);
    }, { signal });
  }

  window.__homeCleanup = () => {
    running = false;
    controller.abort();
    clearTimeout(timerId);
    clearTimeout(startTimerId);
    cancelAnimationFrame(animationId);
    if (idleId != null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
    window.__homeCleanup = () => {};
  };
}

if (!window.__homeListenersAttached) {
  window.__homeListenersAttached = true;
  document.addEventListener('astro:page-load', initHome);
  document.addEventListener('astro:before-swap', () => window.__homeCleanup?.());
}