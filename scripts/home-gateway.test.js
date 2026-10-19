import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root=process.cwd();
const file=p=>fs.readFileSync(path.join(root,p),'utf8');

test('bilingual Tech/Gaming entrance links correctly and Tech introduces real Labs features',()=>{
 const home=file('src/pages/[lang]/index.astro');
 const tech=file('src/pages/[lang]/tech/index.astro');
 const gateway=file('src/components/Home/WorldGateway.astro');
 assert.match(home,/WorldGateway/);
 assert.match(tech,/loadAllProjects/);
 assert.match(tech,/TechPlaylists/);
 assert.match(tech,/tech-landing.css/);
 assert.match(tech,/featuredSlugs/);
 assert.match(tech,/recentPosts/);
 assert.doesNotMatch(tech,/chip-canvas|early-bait|dispositivos simulados/);
 assert.match(gateway,/\$\{lang\}\/tech\//);
 assert.match(gateway,/\$\{lang\}\/under-construction\//);
 assert.match(gateway,/import gatewayArtwork from/);
 assert.match(gateway,/astro:assets/);
 assert.match(gateway,/prefers-reduced-motion/);
 assert.match(gateway,/@media\(max-width:760px\)/);
 for(const lang of ['es','en']){
  const gatewayWords=JSON.parse(file('src/locales/'+lang+'/gateway.json'));
  assert.ok(gatewayWords.heading && gatewayWords.lead && gatewayWords.pageTitle);
  for(const area of ['tech','gaming'])for(const key of ['title','kicker','description','action','status']){
   assert.ok(gatewayWords[area][key]?.trim(),'missing '+area+'.'+key+' in '+lang);
  }
  const t=JSON.parse(file('src/locales/'+lang+'/tech-home.json'));
  assert.ok(t.title&&t.intro&&t.projectsHeading&&t.blogHeading&&t.videoHeading);
  assert.equal(t.destinations.length,4,'Tech links must include projects, blog, portfolio and architecture');
  assert.deepEqual(t.destinations.map(x=>x.key),['projects','blog','portfolio','architecture']);
  assert.equal(t.focus.length,4);
  assert.equal(t.playlists.length,4);
  assert.match(file('src/pages/[lang]/under-construction.astro'),/getStaticPaths/);
 }
});


test('gateway respects original artwork: Gaming left, Tech right, captions below without cropping',()=>{
 const source=file('src/components/Home/WorldGateway.astro');
 const asset=path.join(root,'src/assets/index/index.webp');
 const before=source.indexOf("id: 'gaming'");
 const after=source.indexOf("id: 'tech'");
 assert.ok(before>=0&&after>before,'Gaming must occupy the left half and Tech the right');
 assert.match(source,/aspect-ratio:3\/2/,'preserve original 1536x1024 artwork ratio');
 assert.match(source,/object-fit:contain/,'entire image must be visible');
 assert.ok(source.indexOf('class="world-scene"') < source.indexOf('class="world-choice-grid"'),'text navigation must sit below artwork');
 assert.doesNotMatch(source,/world-image-dim|world-midmark|world-seam|world-copy[^-]/,'no giant overlays or center seam over illustrations');
 assert.ok(fs.existsSync(asset));
});

test('embedded playlists are real SolarisPKN series and YouTube loads only on user click',()=>{
 const player=file('src/components/Home/TechPlaylists.astro');
 const verified=[
 'PLVxh46uVOYfb5YCI8AqG5jK_TB8p0vu9D',
 'PLVxh46uVOYfYbTsYFmaZ31w8AyCOs9yuG',
 'PLVxh46uVOYfYPPkf0sxzGOW0Ws8Tto1Jz',
 'PLVxh46uVOYfbcY-IbZGORC1gU_DU04SeN'
 ];
 for(const id of verified)assert.ok(player.includes(id),'verified playlist missing '+id);
 assert.match(player,/youtube-nocookie\.com/);
 assert.match(player,/function play\(/);
 assert.match(player,/data-video-play/);
 assert.ok(player.indexOf('player.src=')>player.indexOf('function play('),'iframe loaded before click');
});

test('original owner-supplied index.webp must be preserved byte for byte',()=>{
 const asset=path.join(root,'src/assets/index/index.webp');
 assert.ok(fs.existsSync(asset),'Missing original index.webp. Publish owner file to feature branch before merging');
 const bytes=fs.readFileSync(asset);
 assert.equal(bytes.length,162442);
 assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'fe2173f3889b1352bd7e8dd128d559d88953682bb59a28bd9cb1886f0c3db58c');
});
