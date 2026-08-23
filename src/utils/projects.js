// src/utils/projects.js
import fs from 'node:fs';
import path from 'node:path';

const PROJECTS_DIR = path.join(process.cwd(), 'src', 'content', 'projects');

/**
 * Lee los metadatos de los subdirectorios directos de src/content/projects.
 * Las carpetas sin project.json se ignoran de forma intencional.
 */
export function loadAllProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const metadataPath = path.join(PROJECTS_DIR, entry.name, 'project.json');
      if (!fs.existsSync(metadataPath)) return null;

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      return { slug: entry.name, ...metadata };
    })
    .filter(Boolean)
    .sort((a, b) => a.slug.localeCompare(b.slug, 'en'));
}

export function loadProjectsByCategory(category) {
  return loadAllProjects().filter((project) => project.category === category);
}