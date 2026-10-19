import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const load = lang => JSON.parse(fs.readFileSync(path.join(root,'src','locales',lang,'portfolio.json'),'utf8')).experiencia;
const es=load('es'),en=load('en');
const expected=['exo','solarispkn','lubricantes','thezapas'];
const expectedImages={exo:'Exo.webp',solarispkn:'SolarisPKN.webp',lubricantes:'LubricantesVilllars.webp',thezapas:'TheZapas.webp'};
for(const [lang,experience] of [['es',es],['en',en]]){
  assert.ok(experience.titulo,'missing title for '+lang);
  assert.deepEqual(experience.items.map(x=>x.id),expected,'experience order changed');
  for(const item of experience.items){
    assert.equal(item.logo,expectedImages[item.id],'incorrect logo for '+item.id);
    assert.ok(item.titulo && item.cargo && item.fecha && item.texto && item.initials,'incomplete experience '+lang+' '+item.id);
    assert.ok(Array.isArray(item.tecnologias)&&item.tecnologias.length>=3,'missing tech tags');
  }
}
assert.deepEqual(es.items.map(({id,logo})=>({id,logo})),en.items.map(({id,logo})=>({id,logo})),'localized experience structure differs');
const portfolio=fs.readFileSync(path.join(root,'src/pages/[lang]/portfolio.astro'),'utf8');
assert.ok(portfolio.includes('experienceLogoModules') && portfolio.includes('experienceLogos[item.logo]') && portfolio.includes('t.experiencia.items.map'),'experience cards not connected to assets');
for(const [id,filename] of Object.entries(expectedImages)){
  if(!filename)continue;
  const file=path.join(root,'src/assets/portfolio/experience',filename);
  assert.ok(fs.existsSync(file),'required original logo missing: '+filename+' ('+id+')');
  assert.ok(fs.statSync(file).size>0,'empty original logo '+file);
}
console.log('Experience portfolio OK: ES/EN, 4 entries, 4 bundled employer logos.');

const fullEs=JSON.parse(fs.readFileSync(path.join(root,'src/locales/es/portfolio.json'),'utf8'));
const fullEn=JSON.parse(fs.readFileSync(path.join(root,'src/locales/en/portfolio.json'),'utf8'));
for (const [lang,data] of [['es',fullEs],['en',fullEn]]) {
  assert.ok(data.hero.kicker && data.hero.headline && data.hero.resumen,'missing hero '+lang);
  assert.ok(data.hero.verExperiencia && data.hero.verConocimientos,'missing hero links '+lang);
  assert.equal(data.aptitudesMini.length,4,'missing hero domains '+lang);
  assert.ok(data.about.intro && data.about.points.length===4,'missing about overview '+lang);
  assert.ok(Array.isArray(data.sobreMi.parrafos) && data.sobreMi.parrafos.length>=3,'missing profile narrative '+lang);
  assert.equal(data.formacion.grupos.length,5,'incomplete education '+lang);
  assert.ok(data.formacion.grupos.every(x=>x.tipo&&x.titulo&&x.institucion&&x.descripcion&&Array.isArray(x.temas)),'education metadata '+lang);
  assert.match(data.formacion.grupos[0].institucion,/Adultos 2000/,'formal qualification missing '+lang);
  assert.match(data.formacion.grupos[4].institucion,/EXO/,'practice lab attribution missing '+lang);
  const taxonomy=JSON.parse(fs.readFileSync(path.join(root,'src/locales',lang,'portfolioskills.json'),'utf8'));
  assert.equal(taxonomy.coreAreas.length,9,'knowledge grouping incomplete '+lang);
  assert.ok(taxonomy.coreAreas.every(x=>x.title&&x.icon&&x.items.length>=5&&x.items.length<=8),'knowledge grouping is too long or sparse '+lang);
}
const markup=fs.readFileSync(path.join(root,'src/pages/[lang]/portfolio.astro'),'utf8');
for(const marker of ['t.hero.kicker','t.hero.headline','t.sobreMi.parrafos.map','t.formacion.grupos.map','id="conocimientos"','id="certificaciones"','logo-missing']){
  assert.ok(markup.includes(marker),'markup is missing '+marker);
}
console.log('Complete bilingual hero, biography, education, expertise and fallback validated.');
