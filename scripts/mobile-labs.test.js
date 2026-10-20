import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');

test('video player and playlist links are available without JS on mobile',()=>{
  const view=read('src/components/Home/TechPlaylists.astro');
  const code=read('src/scripts/tech-playlists.js');
  const headers=read('public/_headers');
  assert.match(view,/<iframe\s+data-video-fallback-frame/);
  assert.match(view,/www\.youtube-nocookie\.com\/embed\/videoseries/);
  assert.match(view,/playlists\.map\(list => \(/);
  assert.match(view,/class="tech-queue-fallback"/);
  assert.match(view,/data-video-placeholder hidden/);
  assert.match(code,/useNativeEmbed=window\.matchMedia/);
  assert.match(code,/if\(!useNativeEmbed\)readyYouTubePlayer\(\)/);
  assert.match(code,/fallbackFrame\.src=/);
  assert.match(code,/tech-queue-fallback/);
  assert.match(headers,/frame-src[^\n]*https:\/\/www\.youtube-nocookie\.com/);
});

test('Labs categories are discoverable and fit narrow screens',()=>{
  const tech=read('src/pages/[lang]/tech/index.astro');
  const css=read('src/styles/tech-landing.css');
  const tri=read('src/components/Projects/LabsTriptych.astro');
  const cat=read('src/components/Projects/ProjectCategoryPage.astro');
  const nav=read('src/components/Layout/ContextualHeader.astro');
  assert.match(tech,/tech-labs-shortcuts/);
  assert.match(tech,/labWords\[category\]\.title/);
  assert.match(tech,/projects\/\$\{category\}-labs/);
  assert.match(css,/\.tech-labs-shortcuts\{display:grid/);
  assert.match(tri,/\.labs-panel::before/);
  assert.match(tri,/\.labs-mobile-image[^]*?z-index: 0;/);
  assert.match(cat,/grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(nav,/\.site-primary-nav\{flex-wrap:wrap/);
});
