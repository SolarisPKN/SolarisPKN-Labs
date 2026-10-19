// Lightweight, dependency-free SVG navigator for the public architecture map.
function initArchitectureExplorer(root) {
 if(root.dataset.architectureReady==='yes') return;
 const json=root.querySelector('[data-arch-model]');
 if(!json) return;
 let model;
 try{model=JSON.parse(json.textContent);}catch{return;}
 root.dataset.architectureReady='yes';
 const tabs=[...root.querySelectorAll('[data-arch-tab]')];
 const panels=[...root.querySelectorAll('[data-arch-view]')];
 const search=root.querySelector('[data-arch-search]');
 const filters=root.querySelector('[data-arch-filters]');
 const inspector=root.querySelector('[data-arch-inspector]');
 const selection=new Map();
 const views={internal:model.internal,ecosystem:model.ecosystem,planned:model.planned};
 const copies=root.closest('main')?.dataset?.labels||'';
 const locale=document.documentElement.lang==='en'?'en':'es';
 const labels={
  es:{group:'Grupo',status:'Estado',incoming:'Entradas',outgoing:'Salidas',open:'Abrir ficha',source:'Ver fuente',none:'Sin conexiones visibles',all:'Todos',empty:'Sin resultados'},
  en:{group:'Group',status:'Status',incoming:'Incoming',outgoing:'Outgoing',open:'Open project',source:'View source',none:'No visible links',all:'All',empty:'No results'}
 }[locale];
 let active='internal', activeFilter='all';
 const viewboxes=new Map();

 const numberOf=(id,type)=>{
  const graph=views[active];
  return graph.edges.filter(e=>e[type]===id).length;
 };
 const status=()=>root.querySelector('[data-arch-count]');
 function addLink(label,href){
  if(!href||typeof href!=='string')return;
  let url;
  try{url=new URL(href,location.href);}catch{return;}
  if(url.protocol!=='https:'&&url.origin!==location.origin)return;
  const a=document.createElement('a');a.href=url.toString();a.textContent=label;
  if(url.origin!==location.origin){a.target='_blank';a.rel='noopener noreferrer';}
  root.querySelector('[data-arch-links]').appendChild(a);
 }
 function showInspector(id) {
  const graph=views[active], node=graph.nodes.find(n=>n.id===id);
  if(!node)return;
  selection.set(active,id);
  inspector.querySelector('[data-arch-name]').textContent=node.label;
  inspector.querySelector('[data-arch-description]').textContent=node.description;
  inspector.querySelector('[data-arch-group]').textContent=node.group;
  inspector.querySelector('[data-arch-state]').textContent=node.status;
  inspector.querySelector('[data-arch-in]').textContent=String(numberOf(id,'to'));
  inspector.querySelector('[data-arch-out]').textContent=String(numberOf(id,'from'));
  const chips=inspector.querySelector('[data-arch-chips]');
  chips.replaceChildren();
  (node.chips||[]).forEach(chip=>{const span=document.createElement('span');span.textContent=chip;chips.appendChild(span);});
  const lines=inspector.querySelector('[data-arch-connections]');
  lines.replaceChildren();
  const adjacency=graph.edges.filter(e=>e.from===id||e.to===id);
  adjacency.slice(0,14).forEach(edge=>{
   const other=graph.nodes.find(n=>n.id===(edge.from===id?edge.to:edge.from));
   if(!other)return;
   const li=document.createElement('li');
   li.textContent=(edge.from===id?'→ ':'← ')+other.label+(edge.label&&edge.kind!=='catalog'?' · '+edge.label:'');
   lines.appendChild(li);
  });
  if(!lines.childElementCount){const li=document.createElement('li');li.textContent=labels.none;lines.appendChild(li);}
  root.querySelector('[data-arch-links]').replaceChildren();
  addLink(labels.open,node.url);addLink(labels.source,node.source);
  const panel=root.querySelector('[data-arch-view="'+active+'"]');
  panel.querySelectorAll('[data-arch-node]').forEach(el=>{
   el.classList.toggle('is-selected',el.dataset.id===id);
  });
  panel.querySelectorAll('[data-arch-edge]').forEach(el=>{
   const related=el.dataset.from===id||el.dataset.to===id;
   el.classList.toggle('is-neighbor',related);
   el.classList.toggle('is-dimmed',!related);
  });
 }
 function nodeMatches(node){
  if(activeFilter!=='all' && node.group!==activeFilter)return false;
  const q=search.value.trim().toLocaleLowerCase(locale);
  if(!q)return true;
  return [node.label,node.description,...(node.chips||[])].join(' ').toLocaleLowerCase(locale).includes(q);
 }
 function applyFilters(){
  const panel=root.querySelector('[data-arch-view="'+active+'"]');
  const graph=views[active], visible=new Set(graph.nodes.filter(nodeMatches).map(n=>n.id));
  panel.querySelectorAll('[data-arch-node]').forEach(n=>{
   const isVisible=visible.has(n.dataset.id);
   n.style.display=isVisible?'':'none';
  });
  panel.querySelectorAll('[data-arch-edge]').forEach(e=>{
   e.style.display=visible.has(e.dataset.from)&&visible.has(e.dataset.to)?'':'none';
  });
  status().textContent=visible.size+'/'+graph.nodes.length+' '+(locale==='es'?'nodos':'nodes');
  const chosen=selection.get(active);
  if(!chosen||!visible.has(chosen)){
   const first=graph.nodes.find(n=>visible.has(n.id));
   if(first) showInspector(first.id);
   else{
    inspector.querySelector('[data-arch-name]').textContent=labels.empty;
    inspector.querySelector('[data-arch-description]').textContent='';
    inspector.querySelector('[data-arch-chips]').replaceChildren();
    inspector.querySelector('[data-arch-connections]').replaceChildren();
    inspector.querySelector('[data-arch-links]').replaceChildren();
   }
  } else showInspector(chosen);
 }
 function getSvg(){return root.querySelector('[data-arch-svg="'+active+'"]');}
 function initialBox(key){const g=views[key];return {x:0,y:0,w:g.width,h:g.height};}
 function drawViewbox(){
  const v=viewboxes.get(active)||initialBox(active);
  getSvg().setAttribute('viewBox',[v.x,v.y,v.w,v.h].join(' '));
  root.querySelector('[data-arch-scale]').textContent=Math.round(views[active].width/v.w*100)+'%';
 }
 function zoom(factor,clientX,clientY){
  const svg=getSvg(),r=svg.getBoundingClientRect();
  const v=viewboxes.get(active)||initialBox(active);
  const nextW=Math.min(views[active].width*1.25,Math.max(views[active].width*.23,v.w/factor));
  const ratio=nextW/v.w, nextH=v.h*ratio;
  const fx=clientX===undefined?.5:Math.max(0,Math.min(1,(clientX-r.left)/r.width));
  const fy=clientY===undefined?.5:Math.max(0,Math.min(1,(clientY-r.top)/r.height));
  viewboxes.set(active,{x:v.x+v.w*fx-nextW*fx,y:v.y+v.h*fy-nextH*fy,w:nextW,h:nextH});
  drawViewbox();
 }
 function changeTab(key){
  if(!views[key])return;
  active=key;activeFilter='all';search.value='';
  tabs.forEach(t=>{const yes=t.dataset.archTab===key;t.classList.toggle('active',yes);t.setAttribute('aria-selected',String(yes));t.tabIndex=yes?0:-1;});
  panels.forEach(p=>p.hidden=p.dataset.archView!==key);
  const desc=root.querySelector('[data-tab-desc]');
  desc.textContent={es:{internal:'Flujo real de entrega, compilación, contenido y métricas; sin incluir subsistemas futuros.',ecosystem:'Todos los repositorios públicos del catálogo, sus categorías y relaciones comprobadas.',planned:'Conceptos históricos o propuestos que NO están desplegados en Labs.'},en:{internal:'Actual delivery, build, content and metrics flows, excluding hypothetical systems.',ecosystem:'All public catalog repositories, their categories and documented connections.',planned:'Historical and proposed concepts that are NOT deployed in Labs.'}}[locale][key];
  filters.replaceChildren();
  const groups=['all',...new Set(views[key].nodes.map(n=>n.group))];
  groups.forEach(g=>{
   const b=document.createElement('button');b.type='button';b.dataset.archFilter=g;b.textContent=g==='all'?labels.all:g;
   b.setAttribute('aria-pressed',String(g==='all'));b.classList.toggle('active',g==='all');filters.appendChild(b);
  });
  drawViewbox();applyFilters();
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>changeTab(tab.dataset.archTab)));
 tabs.forEach((tab,i)=>tab.addEventListener('keydown',e=>{
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  e.preventDefault();const next=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];changeTab(next.dataset.archTab);next.focus();
 }));
 filters.addEventListener('click',e=>{
  const b=e.target.closest('[data-arch-filter]');if(!b)return;
  activeFilter=b.dataset.archFilter;
  filters.querySelectorAll('button').forEach(x=>{const selected=x===b;x.classList.toggle('active',selected);x.setAttribute('aria-pressed',String(selected));});
  applyFilters();
 });
 search.addEventListener('input',applyFilters);
 panels.forEach(panel=>{
  panel.addEventListener('click',e=>{const node=e.target.closest('[data-arch-node]');if(node){showInspector(node.dataset.id);}});
  panel.addEventListener('keydown',e=>{
   const node=e.target.closest('[data-arch-node]');
   if(node&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showInspector(node.dataset.id);}
  });
  const svg=panel.querySelector('svg');
  svg.addEventListener('wheel',e=>{
   if(panel.hidden)return;
   e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY);
  },{passive:false});
  let drag=null;
  svg.addEventListener('pointerdown',e=>{
   if(panel.hidden||e.button!==0||e.target.closest('[data-arch-node]'))return;
   drag={x:e.clientX,y:e.clientY,view:{...(viewboxes.get(active)||initialBox(active))}};
   svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove',e=>{
   if(!drag||panel.hidden)return;
   const box=svg.getBoundingClientRect();
   const dx=(e.clientX-drag.x)/box.width*drag.view.w;
   const dy=(e.clientY-drag.y)/box.height*drag.view.h;
   viewboxes.set(active,{...drag.view,x:drag.view.x-dx,y:drag.view.y-dy});drawViewbox();
  });
  svg.addEventListener('pointerup',()=>{drag=null;});
  svg.addEventListener('pointercancel',()=>{drag=null;});
  svg.addEventListener('lostpointercapture',()=>{drag=null;});
 });
 root.querySelectorAll('[data-arch-zoom]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.archZoom;
  if(action==='fit'){viewboxes.set(active,initialBox(active));drawViewbox();}
  else zoom(action==='in'?1.25:.8);
 }));
 changeTab('internal');
}
function initializeAllArchitectureExplorers(){
 document.querySelectorAll('[data-architecture-explorer]').forEach(initArchitectureExplorer);
}
document.addEventListener('astro:page-load',initializeAllArchitectureExplorers);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeAllArchitectureExplorers,{once:true});
else initializeAllArchitectureExplorers();
