// src/scripts/home-tech.js
function initHome() {
  // ===== CONTADOR DE CHIPS (canvas) =====
  let count = 0;
  const counterEl = document.getElementById('chip-counter');
  const canvas = document.getElementById('chip-canvas');

  if (canvas) {
    const ctx = canvas.getContext('2d');

    function drawChips(num) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < num; i++) {
        ctx.fillStyle = `hsl(${Date.now() / 20 + i * 30}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(20 + (i % 20) * 38, 50 + Math.floor(i / 20) * 50, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`ESP${i}`, 20 + (i % 20) * 38 - 8, 50 + Math.floor(i / 20) * 50 + 4);
      }
    }

    setInterval(() => {
      if (count < 42) {
        count = Math.min(42, count + Math.floor(Math.random() * 3));
      } else {
        count = 42;
      }
      if (counterEl) counterEl.innerText = count;
      drawChips(count);
    }, 800);

    drawChips(0);
  }

  // ===== EARLY ACCESS BUTTON =====
  const earlyBait = document.getElementById('early-bait');
  if (earlyBait) {
    // Obtener mensajes desde los atributos data-* (ya están en el HTML)
    const messages = {
      message: earlyBait.dataset.message || '📧 Dejame tu correo y te aviso cuando lance Early Access:',
      success: earlyBait.dataset.success || '✅ Gracias! Te avisaremos pronto. (demo sin backend)',
      invalid: earlyBait.dataset.invalid || 'Correo inválido'
    };

    // Remover event listeners antiguos (por si acaso)
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

// ===== EJECUTAR EN CARGA INICIAL Y CADA NAVEGACIÓN =====
document.addEventListener('astro:page-load', initHome);