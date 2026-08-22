// src/utils/projects.js
import fs from 'fs';
import path from 'path';

/**
 * Lee todos los proyectos desde src/content/projects/.
 * Fuente única de verdad — index.astro, core-labs.astro,
 * derived-labs.astro y external-labs.astro usan esta misma función,
 * para no repetir (y desincronizar) la lógica de lectura.
 */
export function loadAllProjects() {
  const root = process.cwd();
  const projectsBaseDir = path.join(root, 'src', 'content', 'projects');
  const projects = [];

  if (fs.existsSync(projectsBaseDir)) {
    const slugs = fs.readdirSync(projectsBaseDir).filter(f =>
      fs.statSync(path.join(projectsBaseDir, f)).isDirectory()
    );
    for (const slug of slugs) {
      const metaPath = path.join(projectsBaseDir, slug, 'project.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        projects.push({ slug, ...meta });
      }
    }
  }

  return projects;
}

export function loadProjectsByCategory(category) {
  return loadAllProjects()
    .filter(p => p.category === category)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}