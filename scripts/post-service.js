import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptDir, '..');

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 30 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/avif', '.avif'],
]);

export function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function requireText(value, label, max = 20000) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label} es obligatorio.`);
  if (text.length > max) throw new Error(`${label} supera el máximo de ${max} caracteres.`);
  return text;
}

function validateDate(value) {
  const date = String(value ?? '');
  const parsed = new Date(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('La fecha debe ser válida y tener formato AAAA-MM-DD.');
  }
  return date;
}

function safeFilename(value) {
  const original = String(value ?? '').trim();
  const filename = path.basename(original).replace(/\s+/g, '-');
  if (!filename || filename !== original.replace(/\s+/g, '-') || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error(`Nombre de imagen no válido: ${original || '(vacío)'}.`);
  }
  return filename;
}

function decodeImage(image) {
  if (!image) return null;
  const name = safeFilename(image.name);
  const mimeType = String(image.mimeType ?? '').toLowerCase();
  const expectedExtension = ALLOWED_IMAGE_TYPES.get(mimeType);
  if (!expectedExtension) throw new Error(`Formato no permitido para ${name}.`);

  const actualExtension = path.extname(name).toLowerCase();
  const jpegExtensions = new Set(['.jpg', '.jpeg']);
  const extensionMatches = mimeType === 'image/jpeg'
    ? jpegExtensions.has(actualExtension)
    : actualExtension === expectedExtension;
  if (!extensionMatches) throw new Error(`La extensión de ${name} no coincide con su formato.`);

  const base64 = String(image.base64 ?? '').replace(/^data:[^;]+;base64,/, '');
  if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(base64)) throw new Error(`Datos inválidos para ${name}.`);
  const data = Buffer.from(base64, 'base64');
  if (!data.length || data.length > MAX_IMAGE_BYTES) {
    throw new Error(`${name} debe pesar entre 1 byte y 10 MB.`);
  }
  return { name, mimeType, data };
}

function inside(rootDir, ...parts) {
  const root = path.resolve(rootDir);
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('La ruta resultante sale del proyecto.');
  }
  return target;
}

function json(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

async function atomicWrite(filePath, content) {
  const tempPath = filePath + `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await fsp.writeFile(tempPath, content);
    await fsp.rename(tempPath, filePath);
  } finally {
    await fsp.rm(tempPath, { force: true });
  }
}

export function validatePostInput(input) {
  const titleEs = requireText(input?.spanish?.title, 'El título en español', 180);
  const descriptionEs = requireText(input?.spanish?.description, 'La descripción en español', 320);
  const contentEs = requireText(input?.spanish?.content, 'El contenido en español', 500000);
  const slug = slugify(input?.slug || titleEs);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('No se pudo generar un slug válido.');

  const englishEnabled = Boolean(input?.english?.enabled);
  const english = englishEnabled ? {
    enabled: true,
    title: requireText(input.english.title, 'El título en inglés', 180),
    description: requireText(input.english.description, 'La descripción en inglés', 320),
    content: requireText(input.english.content, 'El contenido en inglés', 500000),
  } : { enabled: false };

  const hero = decodeImage(input?.hero);
  const gallery = Array.isArray(input?.gallery) ? input.gallery.map(decodeImage).filter(Boolean) : [];
  const allImages = [hero, ...gallery].filter(Boolean);
  const names = new Set();
  let totalBytes = 0;
  for (const image of allImages) {
    const key = image.name.toLowerCase();
    if (names.has(key)) throw new Error(`La imagen ${image.name} está repetida.`);
    names.add(key);
    totalBytes += image.data.length;
  }
  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) throw new Error('Las imágenes superan el máximo total de 30 MB.');

  const tags = [...new Set((Array.isArray(input?.tags) ? input.tags : String(input?.tags ?? '').split(','))
    .map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 20);

  return {
    slug,
    date: validateDate(input?.date),
    category: requireText(String(input?.category ?? '').trim() || 'General', 'La categoría', 100),
    tags,
    spanish: { title: titleEs, description: descriptionEs, content: contentEs },
    english,
    hero,
    gallery,
  };
}

export async function createPost(input, { rootDir = projectRoot } = {}) {
  const post = validatePostInput(input);
  const contentDir = inside(rootDir, 'src', 'content', 'blog', post.slug);
  const imagesDir = inside(rootDir, 'public', 'images', 'posts', post.slug);
  const localeEsPath = inside(rootDir, 'src', 'locales', 'es', 'posts', post.slug + '.json');
  const localeEnPath = inside(rootDir, 'src', 'locales', 'en', 'posts', post.slug + '.json');

  const conflicts = [contentDir, localeEsPath, ...(post.english.enabled ? [localeEnPath] : [])]
    .filter((candidate) => fs.existsSync(candidate));
  if (conflicts.length) {
    const error = new Error(`Ya existe contenido para el slug "${post.slug}". No se sobrescribió nada.`);
    error.code = 'POST_EXISTS';
    throw error;
  }

  const imagePrefix = `/images/posts/${post.slug}/`;
  const meta = {
    id: post.slug,
    date: post.date,
    tags: post.tags,
    category: post.category,
    heroImage: post.hero ? imagePrefix + post.hero.name : '',
    images: post.gallery.map((image) => imagePrefix + image.name),
  };

  const writes = [
    [inside(contentDir, 'post.json'), json(meta)],
    [inside(contentDir, 'index-es.mdx'), post.spanish.content.trim() + '\n'],
    [localeEsPath, json({ title: post.spanish.title, description: post.spanish.description })],
  ];
  if (post.english.enabled) {
    writes.push(
      [inside(contentDir, 'index-en.mdx'), post.english.content.trim() + '\n'],
      [localeEnPath, json({ title: post.english.title, description: post.english.description })],
    );
  }
  for (const image of [post.hero, ...post.gallery].filter(Boolean)) {
    writes.push([inside(imagesDir, image.name), image.data]);
  }

const created = [];
  const createdDirs = [];
  const ensureDir = async (dirPath) => {
    if (fs.existsSync(dirPath)) return;
    await fsp.mkdir(dirPath, { recursive: true });
    createdDirs.push(dirPath);
  };
  try {
    await ensureDir(contentDir);
    await ensureDir(path.dirname(localeEsPath));
    if (post.english.enabled) await ensureDir(path.dirname(localeEnPath));
    if (post.hero || post.gallery.length) await ensureDir(imagesDir);

    for (const [filePath, contents] of writes) {
      await atomicWrite(filePath, contents);
      created.push(filePath);
    }
  } catch (error) {
    await Promise.all(created.map((filePath) => fsp.rm(filePath, { force: true })));
    for (const dirPath of createdDirs.reverse()) {
      await fsp.rmdir(dirPath).catch(() => {});
    }
    throw error;
  }

  return {
    slug: post.slug,
    urls: [
      `/es/blog/${post.slug}`,
      ...(post.english.enabled ? [`/en/blog/${post.slug}`] : []),
    ],
    files: writes.map(([filePath]) => path.relative(rootDir, filePath).replaceAll(path.sep, '/')),
  };
}

export async function getBlogTaxonomy({ rootDir = projectRoot } = {}) {
  const blogDir = inside(rootDir, 'src', 'content', 'blog');
  const categories = new Set();
  const tags = new Set();
  try {
    const entries = await fsp.readdir(blogDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const meta = JSON.parse(await fsp.readFile(path.join(blogDir, entry.name, 'post.json'), 'utf8'));
        if (meta.category) categories.add(meta.category);
        for (const tag of meta.tags ?? []) tags.add(tag);
      } catch {
        // Un post incompleto no debe impedir abrir el editor.
      }
    }
  } catch {
    // Un blog todavía vacío es válido.
  }
  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b, 'es')),
    tags: [...tags].sort((a, b) => a.localeCompare(b, 'es')),
  };
}
