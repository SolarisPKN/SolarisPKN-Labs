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
  assert.equal(t.playlists.length,2);
  assert.deepEqual(t.playlists.map(p=>p.label),lang==='es'?['Tecnología','Automotor']:['Technology','Automotive']);
  assert.match(file('src/pages/[lang]/under-construction.astro'),/getStaticPaths/);
 }
});


test('one original panorama with two clickable jagged halves (Gaming left, Tech right)',()=>{
 const source=file('src/components/Home/WorldGateway.astro');
 const asset=path.join(root,'src/assets/index/index.webp');
 const gaming=source.indexOf("id: 'gaming'");
 const tech=source.indexOf("id: 'tech'");
 assert.ok(gaming>=0&&tech>gaming,'Gaming must be to the left of Tech');
 assert.match(source,/class="world-split"/,'one shared visual surface');
 assert.match(source,/aspect-ratio:3\/2/,'original 1536x1024 aspect ratio must be preserved');
 assert.match(source,/object-fit:contain/,'do not crop the original artwork');
 assert.equal((source.match(/<Image\b/g)||[]).length,1,'only one original panorama image');
 assert.equal((source.match(/<a\b/g)||[]).length,1,'one anchor template produces the two clickable halves');
 assert.equal((source.match(/worlds\.map/g)||[]).length,1,'each half gets exactly one link');
 assert.match(source,/world-gaming\{clip-path:polygon/,'jagged left-hand clickable area');
 assert.match(source,/world-tech\{clip-path:polygon/,'complementary jagged right-hand clickable area');
 assert.match(source,/world-crack-line/,'visible crack along shared boundary');
 assert.doesNotMatch(source,/world-choice-grid|world-hotspot|world-areas|labs-panel/,'no detached cards or duplicate buttons');
 assert.ok(fs.existsSync(asset),'original artwork missing');
});

test('hover particle fields use CSS animation with keyboard and reduced-motion support',()=>{
 const source=file('src/components/Home/WorldGateway.astro');
 assert.match(source,/world-particles/,'particles must exist in both halves');
 assert.match(source,/particles\.map/,'reused lightweight spark elements');
 assert.match(source,/@keyframes world-drift/,'GPU-friendly hover animation');
 assert.match(source,/:is\(:hover,:focus-visible\)/,'hover and keyboard focus reveal');
 assert.match(source,/@media\(prefers-reduced-motion:reduce\)/,'motion preferences honored');
 assert.match(source,/@media\(max-width:760px\)/,'mobile keeps both halves of one picture');
 assert.doesNotMatch(source,/<script\b|setInterval|requestAnimationFrame|<canvas\b/,'no unnecessary JS or canvas loops');
});

test('only two live public playlists, dynamic queue and no Data API key',()=>{
 const player=file('src/components/Home/TechPlaylists.astro')+'\n'+file('src/scripts/tech-playlists.js');
 const worker=file('src/worker.js');
 const parser=file('src/utils/tech-playlist-feed.js');
 const verified=['PLVxh46uVOYfb5YCI8AqG5jK_TB8p0vu9D','PLVxh46uVOYfYbTsYFmaZ31w8AyCOs9yuG'];
 for(const id of verified)assert.ok(player.includes(id),'required playlist missing '+id);
 assert.doesNotMatch(player,/PLVxh46uVOYfYPPkf0sxzGOW0Ws8Tto1Jz|PLVxh46uVOYfbcY-IbZGORC1gU_DU04SeN/,'retired playlists must not remain');
 assert.match(player,/getPlaylist\(/,'read current playlist IDs from official IFrame player');
 assert.match(player,/playVideoAt\(/,'select any listed video for same player');
 assert.match(player,/play\(0,false\)|select\(0\)/,'load the first playlist automatically');
 assert.match(player,/readyYouTubePlayer\(\)/,'initialize official keyless embedded player');
 assert.match(player,/data-video-list/,'render playlist queue alongside the player');
 assert.match(player,/tech-video-layout\{display:grid;grid-template-columns:/,'right sidebar visible on desktop');
 assert.match(player,/function drawCombined\(/,'combine live player IDs with feed titles');
 assert.match(player,/https:\/\/www\.youtube\.com\/iframe_api/);
 assert.match(worker,/\/api\/tech-playlist/);
 assert.match(worker,/fetchRecentPublicPlaylist/);
 assert.match(parser,/\/feeds\/videos\.xml\?playlist_id=/,'public feed, no token');
 assert.doesNotMatch(parser,/YOUTUBE_API_KEY|googleapis\.com\/youtube\/v3/,'no YouTube Data API key');
});

test('Content Security Policy permits keyless YouTube player script and frames',()=>{
 const csp=file('public/_headers').split('\n').find(line=>line.trim().startsWith('Content-Security-Policy:'));
 assert.ok(csp);
 assert.match(csp,/script-src[^;]*https:\/\/www\.youtube\.com/);
 assert.match(csp,/frame-src\s+https:\/\/www\.youtube-nocookie\.com/);
 assert.match(csp,/frame-ancestors\s+'self'/);
 assert.match(csp,/script-src\s+'self'/);
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
