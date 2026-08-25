import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createPost, slugify, validatePostInput } from './post-service.js';

test('slugify conserva un slug portable', () => {
  assert.equal(slugify('  Teoría, Práctica & IA  '), 'teoria-practica-ia');
});

test('valida fechas e idioma inglés completo', () => {
  assert.throws(() => validatePostInput({
    date: '25/08/2026',
    spanish: { title: 'Título', description: 'Descripción', content: 'Contenido' },
    english: { enabled: false },
  }), /AAAA-MM-DD/);

  assert.throws(() => validatePostInput({
    date: '2026-08-25',
    spanish: { title: 'Título', description: 'Descripción', content: 'Contenido' },
    english: { enabled: true, title: '', description: '', content: '' },
  }), /inglés/);
});

test('crea el conjunto bilingüe y rechaza sobrescrituras', async (t) => {
  const rootDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'solarispkn-post-'));
  t.after(() => fsp.rm(rootDir, { recursive: true, force: true }));

  const input = {
    slug: 'post-de-prueba',
    date: '2026-08-25',
    category: 'Pruebas',
    tags: 'IA, Pruebas, IA',
    spanish: {
      title: 'Post de prueba',
      description: 'Descripción breve',
      content: '## Contenido\n\nTexto.',
    },
    english: {
      enabled: true,
      title: 'Test post',
      description: 'Short description',
      content: '## Content\n\nText.',
    },
    hero: null,
    gallery: [],
  };

  const result = await createPost(input, { rootDir });
  assert.deepEqual(result.urls, ['/es/blog/post-de-prueba', '/en/blog/post-de-prueba']);

  const metaPath = path.join(rootDir, 'src', 'content', 'blog', 'post-de-prueba', 'post.json');
  const meta = JSON.parse(await fsp.readFile(metaPath, 'utf8'));
  assert.deepEqual(meta.tags, ['IA', 'Pruebas']);
  assert.equal(meta.heroImage, '');

  await fsp.access(path.join(rootDir, 'src', 'content', 'blog', 'post-de-prueba', 'index-es.mdx'));
  await fsp.access(path.join(rootDir, 'src', 'content', 'blog', 'post-de-prueba', 'index-en.mdx'));
  await fsp.access(path.join(rootDir, 'src', 'locales', 'es', 'posts', 'post-de-prueba.json'));
  await fsp.access(path.join(rootDir, 'src', 'locales', 'en', 'posts', 'post-de-prueba.json'));

  await assert.rejects(createPost(input, { rootDir }), /No se sobrescribió nada/);
});
