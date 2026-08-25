const byId = (id) => document.getElementById(id);
const form = byId('post-form');
const slugInput = byId('slug');
let slugTouched = false;
let previewTimer;

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function setStatus(message, kind = '') {
  const status = byId('status');
  status.className = 'status ' + kind;
  status.textContent = message;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'La operación falló.');
  return data;
}

function fillList(id, values) {
  byId(id).replaceChildren(...values.map((value) => {
    const option = document.createElement('option');
    option.value = value;
    return option;
  }));
}

async function refreshPreview(lang) {
  const markdown = byId('content-' + lang).value;
  const data = await api('/api/preview', { method: 'POST', body: JSON.stringify({ markdown }) });
  byId('preview-' + lang).innerHTML = data.html || '<p class="empty">La vista previa aparecerá acá.</p>';
}

function schedulePreview(lang) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => refreshPreview(lang).catch((error) => setStatus(error.message, 'error')), 250);
}

function editSelection(textarea, { wrap = '', prefix = '', block = '' }) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || (block ? 'código' : 'texto');
  const replacement = block
    ? '\n\n\`\`\`javascript\n' + selected + '\n\`\`\`\n'
    : prefix + wrap + selected + wrap;
  textarea.setRangeText(replacement, start, end, 'select');
  textarea.dispatchEvent(new Event('input'));
  textarea.focus();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer ' + file.name));
    reader.onload = () => resolve({
      name: file.name.replace(/\s+/g, '-'),
      mimeType: file.type,
      base64: String(reader.result).split(',')[1],
    });
    reader.readAsDataURL(file);
  });
}

function imageSummary() {
  const files = [...(byId('hero').files || []), ...(byId('gallery').files || [])];
  byId('image-summary').textContent = files.length
    ? files.map((file) => `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`).join(' | ')
    : 'Todavía no seleccionaste imágenes.';
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.language-pane').forEach((pane) => pane.classList.toggle('active', pane.id === 'pane-' + tab.dataset.lang));
  schedulePreview(tab.dataset.lang);
}));

document.querySelectorAll('.toolbar button').forEach((button) => button.addEventListener('click', () => {
  const textarea = byId(button.closest('.toolbar').dataset.target);
  editSelection(textarea, {
    wrap: button.dataset.wrap,
    prefix: button.dataset.prefix,
    block: button.dataset.block,
  });
}));

document.querySelectorAll('.content').forEach((textarea) => textarea.addEventListener('input', () => schedulePreview(textarea.id.endsWith('en') ? 'en' : 'es')));
byId('title-es').addEventListener('input', (event) => {
  if (!slugTouched) slugInput.value = slugify(event.target.value);
});
slugInput.addEventListener('input', () => { slugTouched = true; slugInput.value = slugify(slugInput.value); });
byId('hero').addEventListener('change', imageSummary);
byId('gallery').addEventListener('change', imageSummary);

byId('english-enabled').addEventListener('change', (event) => {
  for (const id of ['title-en', 'description-en', 'content-en']) byId(id).required = event.target.checked;
  document.querySelector('[data-lang="en"]').disabled = !event.target.checked;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Validando y creando archivos…', 'working');
  byId('submit').disabled = true;
  try {
    const heroFile = byId('hero').files[0];
    const galleryFiles = [...byId('gallery').files];
    const payload = {
      slug: slugInput.value,
      date: byId('date').value,
      category: byId('category').value,
      tags: byId('tags').value,
      spanish: {
        title: byId('title-es').value,
        description: byId('description-es').value,
        content: byId('content-es').value,
      },
      english: {
        enabled: byId('english-enabled').checked,
        title: byId('title-en').value,
        description: byId('description-en').value,
        content: byId('content-en').value,
      },
      hero: heroFile ? await readFile(heroFile) : null,
      gallery: await Promise.all(galleryFiles.map(readFile)),
    };
    const result = await api('/api/posts', { method: 'POST', body: JSON.stringify(payload) });
    setStatus('Post creado. Rutas: ' + result.urls.join(' · ') + '\nArchivos:\n' + result.files.join('\n'), 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    byId('submit').disabled = false;
  }
});

byId('shutdown').addEventListener('click', async () => {
  try { await api('/api/shutdown', { method: 'POST', body: '{}' }); } catch {}
  document.body.innerHTML = '<main class="closed"><h1>Editor cerrado</h1><p>Ya podés cerrar esta pestaña.</p></main>';
});

const bootstrap = await api('/api/bootstrap');
byId('date').value = bootstrap.date;
fillList('categories', bootstrap.categories);
fillList('tags', bootstrap.tags);
byId('english-enabled').dispatchEvent(new Event('change'));
refreshPreview('es');
