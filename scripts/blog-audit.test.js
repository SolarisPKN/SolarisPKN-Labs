import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('index only advertises localized posts with existing article content',()=>{
  const index=read('src/pages/[lang]/blog/index.astro');
  const article=read('src/pages/[lang]/blog/[slug].astro');
  assert.match(index,/index-' \+ lang \+ '\.mdx'/);
  assert.match(article,/contentExists && localeExists/);
  assert.match(index,/description=\{t\.descripcion\}/);
});

test('tag filters remove actual grid items, preserve focus and show results',()=>{
  const index=read('src/pages/[lang]/blog/index.astro');
  const script=read('src/scripts/blog.js');
  const css=read('src/styles/blog.css');
  assert.match(index,/class="post-card-link" data-tags=/);
  assert.match(index,/<details class="blog-tag-picker">/);
  assert.match(index,/data-blog-result-count/);
  assert.match(script,/querySelectorAll\('\.post-card-link'\)/);
  assert.match(script,/card\.hidden = !matches/);
  assert.match(css,/\.post-card-link\[hidden\]\{display:none!important\}/);
  assert.match(css,/@media\(max-width:540px\)/);
});

test('article metadata, links, readable code and truthful recent sidebar',()=>{
  const page=read('src/pages/[lang]/blog/[slug].astro');
  const index=read('src/pages/[lang]/blog/index.astro');
  const layout=read('src/layouts/Layout.astro');
  const seo=read('src/components/SEO.astro');
  const css=read('src/styles/blog-post.css');
  assert.match(page,/seoType="article"/);
  assert.match(page,/schema="article"/);
  assert.match(page,/publishedTime=/);
  assert.match(page,/blog-article-breadcrumb/);
  assert.match(layout,/publishedTime=\{publishedTime\}/);
  assert.match(seo,/\$\{fullUrl\}#article/);
  assert.match(index,/\{t\.recientes\}/);
  assert.match(css,/\.prose pre\{max-width:100%;overflow-x:auto/);
});

test('both locales provide user-facing filter labels',()=>{
  for(const lang of ['es','en']){
    const words=JSON.parse(read('src/locales/'+lang+'/blog.json'));
    assert.ok(words.recientes && words.resultados && words.filtrarPorTags);
  }
});
