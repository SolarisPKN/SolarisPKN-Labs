import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const layout = readFileSync(new URL('../src/pages/[lang]/portfolio.astro', import.meta.url),'utf8');
const generator = readFileSync(new URL('./generate-cvs.py', import.meta.url),'utf8');

test('portfolio buttons use the correct CV language on both locations',()=>{
  assert.match(layout, /const cvDownloadUrl = lang === 'en' \? '\/cv-en\.pdf' : '\/cv-es\.pdf'/);
  assert.equal((layout.match(/href=\{cvDownloadUrl\}/g)||[]).length, 2);
  assert.doesNotMatch(layout,/href="\/cv\.pdf"/);
});

test('both downloadable CVs exist and legacy CV does not',()=>{
  for(const lang of ['en','es']){
    const path=new URL('../public/cv-'+lang+'.pdf',import.meta.url);
    assert.equal(existsSync(path),true,String(path));
    const binary=readFileSync(path);
    assert.ok(binary.byteLength>10000,String(path));
    assert.equal(binary.toString('ascii',0,5),'%PDF-');
  }
  assert.equal(existsSync(new URL('../public/cv.pdf',import.meta.url)),false);
});

test('PDF generator preserves the ATS and language editions',()=>{
  assert.match(generator,/CORE COMPETENCIES \(ATS\)/);
  assert.match(generator,/COMPETENCIAS CLAVE \(ATS\)/);
  assert.match(generator,/\('en','es'\)/);
  assert.match(generator,/if self\.y-h<BOTTOM\+20/);
});
