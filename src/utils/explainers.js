// src/utils/explainers.js
import fs from 'fs';
import path from 'path';

/**
 * Recorre src/components/Projects/explainers/ (menos la subcarpeta content/)
 * buscando archivos .astro, sin importar en qué subcarpeta de categoría estén.
 * El match es por nombre de archivo (minúscula), no por ubicación física.
 *
 * Vive en su propio archivo (no como función suelta dentro de [slug].astro)
 * porque getStaticPaths() corre en un scope aislado en Astro: solo puede usar
 * imports, nunca funciones/constantes declaradas como top-level del mismo
 * archivo .astro.
 */
export function findExplainerAstroFiles() {
  const root = process.cwd();
  const explainersDir = path.join(root, 'src', 'components', 'Projects', 'explainers');
  const found = {};

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'content') continue;
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.astro')) {
        const key = entry.name.replace(/\.astro$/, '').toLowerCase();
        found[key] = full;
      }
    }
  }

  walk(explainersDir);
  return found;
}