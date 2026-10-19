import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read=(p)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('gateway has only account and language while Tech and Gaming use scoped menus',()=>{
 const home=read('src/pages/[lang]/index.astro');
 const layout=read('src/layouts/Layout.astro');
 const header=read('src/components/Layout/ContextualHeader.astro');
 const tech=read('src/pages/[lang]/tech/index.astro');
 const gaming=read('src/pages/[lang]/gaming/index.astro');
 const portal=read('src/components/Home/WorldGateway.astro');
 assert.match(home,/navigation="gateway"/,'home must explicitly request isolated selector toolbar');
 assert.match(header, /mode!=='gateway' && \(/,'no logo or nav on gateway');
 assert.match(header,/site-header-gateway/,'minimal landing header');
 assert.match(header,/site-account/);
 assert.match(header,/id="lang-btn"/);
 assert.match(header,/id="lang-dropdown"/);
 assert.match(header,/href=\{accountHref\}/);
 assert.match(header,/mode==='tech'/,'technical menu has own links');
 for(const link of ['/blog/','/projects/','/arquitectura/','/portfolio/']){
  assert.ok(header.includes(link),'missing technical navigation link '+link);
 }
 assert.match(header,/href:\x60\/\$\{lang\}\/tech\/\x60/,'Tech home must stay inside Tech');
 assert.match(header,/href:\x60\/\$\{lang\}\/gaming\/\x60/,'Gaming home has its own route');
 for(const anchor of ['directos','videos','comunidad']){
  assert.ok(header.includes('/gaming/#'+anchor),'missing Gaming navigation anchor '+anchor);
  assert.ok(gaming.includes('id={section.id}'),'Gaming anchor cards missing');
 }
 assert.match(portal,/id: 'gaming', href: \x60\/\$\{lang\}\/gaming\//);
 assert.match(gaming,/navigation="gaming"/);
 assert.match(gaming,/getStaticPaths/);
 assert.doesNotMatch(tech,/navigation="gateway"|navigation="gaming"/);
 assert.match(layout,/navigation = 'tech'/,'existing technical pages retain full nav by default');
 assert.match(layout,/ContextualHeader/);
 assert.doesNotMatch(layout,/href=\{\x60\/\$\{lang\}\/blog\/\x60\}/,'hardcoded global navbar must be gone');
});

test('Gaming is clearly under construction, bilingual, with no disguised Tech sections',()=>{
 const gaming=read('src/pages/[lang]/gaming/index.astro');
 for(const lang of ['es','en']){
  const common=JSON.parse(read('src/locales/'+lang+'/common.json'));
  const data=JSON.parse(read('src/locales/'+lang+'/gaming.json'));
  for(const key of ['mundos','gaming','directos','videos','comunidad','visitarTech']){
    assert.ok(common.nav[key]?.length,'missing navigation translation '+lang+':'+key);
  }
  assert.ok(data.badge&&data.headline&&data.pending&&data.intro);
  assert.deepEqual(data.sections.map(x=>x.id),['directos','videos','comunidad']);
 }
 assert.doesNotMatch(gaming,/blog\/|projects\/|arquitectura\/|portfolio\//,
   'Gaming should not display Tech sections in its construction overview');
});

test('universal round SVG back-to-top replaces the square emoji and has one listener source',()=>{
 const layout=read('src/layouts/Layout.astro');
 const portfolio=read('src/pages/[lang]/portfolio.astro');
 const layoutJs=read('src/scripts/layout.js');
 const scrollJs=read('src/scripts/backToTop.js');
 const css=read('src/styles/global.css');
 const pCss=read('src/styles/portfolio.css');
 assert.equal((layout.match(/id="back-to-top"/g)||[]).length,1,'layout owns exactly one button');
 assert.doesNotMatch(portfolio,/id="back-to-top"|initBackToTop\(|⬆️/,'portfolio must inherit global button');
 assert.doesNotMatch(pCss,/\.back-to-top/,'portfolio stylesheet should not override universal button');
 assert.match(layout,/<svg viewBox="0 0 24 24"/);
 assert.match(layout,/stroke-linecap="round"/);
 assert.match(layout,/stroke-linejoin="round"/);
 assert.match(layout,/lang==='es'\?'Volver arriba':'Back to top'/);
 assert.match(css,/\.back-to-top\{/);
 assert.match(css,/border-radius:50%/);
 assert.match(css,/\.back-to-top\[hidden\]\{display:none\}/);
 assert.match(scrollJs,/window\.scrollY<=320/);
 assert.match(scrollJs,/window\.scrollTo\(\{top:0/);
 assert.match(scrollJs,/prefers-reduced-motion: reduce/);
 assert.match(layoutJs,/initBackToTop\(\)/);
 assert.match(layoutJs,/astro:page-load/);
 assert.match(layoutJs,/astro:before-swap/);
});
