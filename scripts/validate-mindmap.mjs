import fs from 'node:fs';
import assert from 'node:assert/strict';

const locales = ['es', 'en'];
const graphs = locales.map(locale => JSON.parse(fs.readFileSync(new URL('../src/locales/' + locale + '/mindmap.json', import.meta.url), 'utf8')));
const [es,en] = graphs;
const uiKeys = ['title','subtitle','search','all','works','projects','areas','skills','full','focus','reset','fit','zoomIn','zoomOut','empty','hint','connections','open','applied','learning','exploring','nodes','edges','select','source'];
const required = ['person','work:exo','work:solarispkn','work:lubricantes-villars','work:thezapas','project:SolarisPKN-IA','project:SolarisPKN-Engineer','project:SolarisPKN-Control','skill:yocto','skill:raspberry-pi','skill:saltstack','skill:microsoft-azure'];
for (const [i,g] of graphs.entries()){
  assert.equal(g.locale,locales[i], 'locale label mismatch');
  assert.equal(g.version,1);
  assert.ok(g.nodes.length>150 && g.edges.length>200, 'graph missing content');
  assert.equal(new Set(g.nodes.map(n=>n.id)).size,g.nodes.length,'duplicate IDs');
  const ids = new Set(g.nodes.map(n=>n.id));
  for (const id of required)assert.ok(ids.has(id), 'required node missing: '+id);
  for (const node of g.nodes){
    assert.ok(node.id && node.label && node.type, 'incomplete node');
    assert.ok(['root','work','project','area','skill'].includes(node.type), 'unknown node type');
    if(node.url)assert.ok(/^https:\/\/github\.com\/SolarisPKN\//.test(node.url),'unsafe project url');
  }
  for(const edge of g.edges){assert.ok(ids.has(edge.source)&&ids.has(edge.target),'dangling edge '+JSON.stringify(edge));}
  assert.equal(new Set(g.edges.map(e=>[e.source,e.target,e.relation].join('|'))).size,g.edges.length,'duplicate relations');
  for(const key of uiKeys)assert.ok(typeof g.ui[key]==='string' && g.ui[key].trim(), 'missing UI string '+key);
}
assert.deepEqual(es.nodes.map(n=>[n.id,n.type,n.status,n.url]),en.nodes.map(n=>[n.id,n.type,n.status,n.url]),'locale structure mismatch');
assert.deepEqual(es.edges,en.edges,'localized edge mismatch');
const page = fs.readFileSync(new URL('../src/pages/[lang]/portfolio.astro',import.meta.url),'utf8');
assert.ok(page.includes('initMindMap()') && page.includes('mindmap-data') && !page.includes('mind-map-placeholder'),'portfolio not wired');
console.log('Mindmap OK:',es.nodes.length,'nodes;',es.edges.length,'edges; es/en identical graph topology.');
