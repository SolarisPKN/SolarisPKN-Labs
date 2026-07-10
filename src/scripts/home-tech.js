// src/scripts/home-tech.js
function initHome() {
  // ===== CONTADOR DE CHIPS (canvas) =====
  const canvas = document.getElementById('chip-canvas');
  const counterEl = document.getElementById('chip-counter');
  if (!canvas || !counterEl) return;

  // Solo ejecutar cuando el navegador esté inactivo
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initCanvas, { timeout: 2000 });
  } else {
    setTimeout(initCanvas, 500);
  }

  function initCanvas() {
    const ctx = canvas.getContext('2d');
    let count = 0;
    let isRunning = true;
    let animationFrame = null;
    const MAX_CHIPS = 30; // Reducimos de 42 a 30 para móvil
    const INTERVAL = 2000; // Aumentamos a 2s para menos carga

    function drawChips(num) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Dibujar menos chips para mejorar rendimiento
      const chipsToDraw = Math.min(num, MAX_CHIPS);
      for (let i = 0; i < chipsToDraw; i++) {
        ctx.fillStyle = `hsl(${Date.now() / 20 + i * 30}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(20 + (i % 20) * 38, 50 + Math.floor(i / 20) * 50, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`ESP${i}`, 20 + (i % 20) * 38 - 8, 50 + Math.floor(i / 20) * 50 + 4);
      }
    }

    function updateLoop() {
      if (!isRunning) return;
      if (count < MAX_CHIPS) {
        count = Math.min(MAX_CHIPS, count + Math.floor(Math.random() * 3));
      } else {
        count = MAX_CHIPS;
      }
      counterEl.innerText = count;
      drawChips(count);
      // Programar la siguiente actualización
      animationFrame = setTimeout(() => {
        requestAnimationFrame(updateLoop);
      }, INTERVAL);
    }

    // Iniciar con un retraso para no bloquear el renderizado inicial
    setTimeout(() => {
      drawChips(0);
      updateLoop();
    }, 500);

    // Pausar cuando la pestaña no está visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isRunning = false;
        if (animationFrame) {
          clearTimeout(animationFrame);
          animationFrame = null;
        }
      } else {
        isRunning = true;
        updateLoop();
      }
    });
  }

  // ===== EARLY ACCESS BUTTON (sin cambios) =====
  const earlyBait = document.getElementById('early-bait');
  if (earlyBait) {
    const messages = {
      message: earlyBait.dataset.message || '📧 Dejame tu correo y te aviso cuando lance Early Access:',
      success: earlyBait.dataset.success || '✅ Gracias! Te avisaremos pronto. (demo sin backend)',
      invalid: earlyBait.dataset.invalid || 'Correo inválido'
    };
    const newBait = earlyBait.cloneNode(true);
    earlyBait.parentNode.replaceChild(newBait, earlyBait);
    newBait.addEventListener('click', () => {
      const email = prompt(messages.message);
      if (email && email.includes('@')) {
        alert(messages.success);
        console.log('Email capturado:', email);
      } else if (email) {
        alert(messages.invalid);
      }
    });
  }
}

document.addEventListener('astro:page-load', initHome);