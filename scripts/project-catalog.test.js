import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectsDir = path.join(projectRoot, 'src', 'content', 'projects');
const categories = new Set(['core', 'derived', 'external']);
const publicProjectNames = new Set(["SolarisPKN-Engineer","SolarisPKN-IA","SolarisPKN-Arts","SolarisPKN-Transport","SolarisPKN-OS","SolarisPKN-Converter","Villars-Informa","Lubricantes-Villars","La-Cascada-de-Any-s","Analia-Orayen---Terapeuta-Integral","Figma-Lab","Replit-test01-mystic-","Replit-Test02-SoldierCards-","skills-introduction-to-github","SolarisPKN-Control","SolarisPKN-Labs","SolarisPKN-LiveTools","SolarisPKN-Stats"]);
const excluded = new Set(['solaris-learning-hub']);

test('all public projects have bilingual metadata and a resolvable content page', () => {
  const folders = fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  assert.equal(folders.length, 18, 'Unexpected number of reviewed public projects');
  assert.deepEqual(new Set(folders), publicProjectNames);
  for (const folder of folders) {
    assert.ok(!excluded.has(folder.toLowerCase()), 'Private repository must never appear in public catalog');
    const dir = path.join(projectsDir, folder);
    const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
    assert.ok(categories.has(metadata.category), folder + ': invalid category');
    assert.equal(metadata.statsId ?? folder.toLowerCase(), folder.toLowerCase(), folder + ': stats ID differs from published repo slug');
    assert.equal(metadata.links?.github, 'https://github.com/SolarisPKN/' + folder, folder + ': incorrect GitHub link');
    for (const lang of ['es', 'en']) {
      assert.ok(metadata.name?.[lang], folder + ': missing name in ' + lang);
      assert.ok(metadata.shortDescription?.[lang], folder + ': missing summary in ' + lang);
      const mdx = path.join(dir, 'index-' + lang + '.mdx');
      const explainer = path.join(projectRoot, 'src', 'components', 'Projects', 'explainers', 'content', lang, folder.toLowerCase() + '.json');
      assert.ok(fs.existsSync(mdx) || fs.existsSync(explainer), folder + ': no readable page for ' + lang);
      if (fs.existsSync(mdx)) assert.ok(fs.readFileSync(mdx, 'utf8').trim().length > 40, folder + ': empty narrative');
    }
  }
});

test('projects are consistently separated by origin', () => {
  const expected = new Map([["SolarisPKN-Engineer","core"],["SolarisPKN-IA","core"],["SolarisPKN-Arts","core"],["SolarisPKN-Transport","core"],["SolarisPKN-OS","core"],["SolarisPKN-Converter","core"],["Villars-Informa","derived"],["Lubricantes-Villars","derived"],["La-Cascada-de-Any-s","derived"],["Analia-Orayen---Terapeuta-Integral","derived"],["Figma-Lab","external"],["Replit-test01-mystic-","external"],["Replit-Test02-SoldierCards-","external"],["skills-introduction-to-github","external"],["SolarisPKN-Control","core"],["SolarisPKN-Labs","core"],["SolarisPKN-LiveTools","core"],["SolarisPKN-Stats","core"]]);
  for (const [name, category] of expected) {
    const metadata = JSON.parse(fs.readFileSync(path.join(projectsDir, name, 'project.json'), 'utf8'));
    assert.equal(metadata.category, category, name + ': wrong category');
  }
});
