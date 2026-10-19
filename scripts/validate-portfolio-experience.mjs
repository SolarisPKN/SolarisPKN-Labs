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
  if(fs.existsSync(file))assert.ok(fs.statSync(file).size>0,'empty image '+file);
  else console.warn('Logo pending Git commit:',filename,'('+id+')');
}
console.log('Experience portfolio OK: ES/EN, 4 entries, 4 optional employer logos.');
