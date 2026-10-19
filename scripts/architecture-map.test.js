import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAllProjects } from '../src/utils/projects.js';
import { buildArchitectureMap } from '../src/utils/architecture-map.js';

test('architecture is bilingual and covers every published project without private paths',()=>{
 const projects=loadAllProjects();
 const es=buildArchitectureMap(projects,'es');
 const en=buildArchitectureMap(projects,'en');
 for(const model of [es,en]){
   assert.equal(model.totalProjects,projects.length);
   assert.equal(model.counts.core+model.counts.derived+model.counts.external,projects.length);
   assert.equal(model.ecosystem.nodes.filter(n=>n.group!=='hub').length,projects.length);
   const ids=new Set(model.ecosystem.nodes.map(n=>n.id));
   for(const edge of model.ecosystem.edges){assert.ok(ids.has(edge.from)&&ids.has(edge.to));}
   assert.equal(model.relationships.length,4);
   assert.ok(!JSON.stringify(model).includes('D:\\'));
   assert.ok(model.internal.nodes.some(n=>n.id==='worker'));
   assert.ok(model.planned.nodes.every(n=>n.status==='planned'));
   assert.ok(model.planned.edges.every(e=>e.kind==='planned'));
 }
 assert.notEqual(es.internal.nodes[0].label,en.internal.nodes[0].label);
});

test('removing a project also removes its relationships, without inventing substitutes',()=>{
 const small=loadAllProjects().filter(p=>p.slug!=='Figma-Lab');
 const graph=buildArchitectureMap(small,'es');
 assert.equal(graph.relationships.length,3);
 assert.ok(graph.relationships.every(r=>r.from!=='Figma-Lab'));
});
