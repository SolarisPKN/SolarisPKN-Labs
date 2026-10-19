import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root=process.cwd();
const file=p=>fs.readFileSync(path.join(root,p),'utf8');

test('the bilingual gateway is the only homepage, preserves original tech landing and routes gaming to construction',()=>{
 const home=file('src/pages/[lang]/index.astro');
 const tech=file('src/pages/[lang]/tech/index.astro');
 const gateway=file('src/components/Home/WorldGateway.astro');
 const originalStyles=file('src/styles/home-tech.css');
 assert.match(home,/WorldGateway/);
 assert.match(tech,/chip-canvas/);
 assert.match(tech,/early-bait/);
 assert.match(tech,/home-tech\.css/);
 assert.ok(originalStyles.length>600);
 assert.match(gateway,/\$\{lang\}\/tech\//);
 assert.match(gateway,/\$\{lang\}\/under-construction\//);
 assert.match(gateway,/import gatewayArtwork from/);
 assert.match(gateway,/astro:assets/);
 assert.match(gateway,/prefers-reduced-motion/);
 assert.match(gateway,/@media\(max-width:760px\)/);
 for(const lang of ['es','en']){
  const words=JSON.parse(file('src/locales/'+lang+'/gateway.json'));
  for(const key of ['heading','lead','select','note','pageTitle']){
   assert.ok(words[key]?.length>10,'missing translated '+key+' in '+lang);
  }
  for(const area of ['tech','gaming']){
   for(const key of ['title','kicker','description','action','status']){
    assert.ok(words[area][key]?.trim(),'missing '+area+'.'+key+' in '+lang);
   }
  }
  assert.match(file('src/pages/[lang]/under-construction.astro'),/getStaticPaths/);
 }
});

test('original owner-provided WebP is committed unchanged before deploying the new gateway',()=>{
 const asset=path.join(root,'src/assets/index/index.webp');
 assert.ok(fs.existsSync(asset),'Missing image: push the owner-provided index.webp to the feature branch first');
 const bytes=fs.readFileSync(asset);
 assert.ok(bytes.length>=10240,'Unexpectedly tiny gateway image');
 assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'fe2173f3889b1352bd7e8dd128d559d88953682bb59a28bd9cb1886f0c3db58c','Do not silently replace the approved user-provided artwork');
});
