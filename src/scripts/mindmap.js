// Knowledge graph viewer: no runtime dependencies, no external AI requests.
const NS = "http://www.w3.org/2000/svg";
const colors = { root:"#f3bd6b", work:"#f38cae", project:"#46cba7", area:"#6bbfff", skill:"#baa6f9" };

export function initMindMap() {
  const host = document.getElementById("knowledge-map");
  const json = document.getElementById("mindmap-data");
  if (!host || !json || host.dataset.initialized === "true") return () => {};
  let graph;
  try { graph = JSON.parse(json.textContent || "{}"); } catch { return () => {}; }
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return () => {};
  host.dataset.initialized = "true";
  const ui = graph.ui;
  const svg = host.querySelector("#mindmap-svg");
  const search = host.querySelector("#mindmap-search");
  const results = host.querySelector("#mindmap-results");
  const kind = host.querySelector("#mindmap-kind");
  const detail = host.querySelector("#mindmap-detail");
  const counter = host.querySelector("#mindmap-counter");
  const modeButton = host.querySelector("#mindmap-mode");
  const controller = new AbortController();
  const signal = controller.signal;
  const byId = new Map(graph.nodes.map(n => [n.id,n]));
  const linked = new Map(graph.nodes.map(n => [n.id,new Set()]));
  const relations = new Map(graph.nodes.map(n => [n.id,[]]));
  const validEdges = graph.edges.filter(e => byId.has(e.source) && byId.has(e.target));
  validEdges.forEach(e => {
    linked.get(e.source).add(e.target);
    linked.get(e.target).add(e.source);
    relations.get(e.source).push({id:e.target,relation:e.relation});
    relations.get(e.target).push({id:e.source,relation:e.relation});
  });
  let focused = "person", mode = "focus", selectedType = "all";
  let nodesToDraw = [], positions = new Map(), view = {x:-620,y:-355,w:1240,h:710};
  let pointer = null, suppressClick = false;

  const element = (tag,attrs={}) => {
    const el = document.createElementNS(NS,tag);
    for (const [key,val] of Object.entries(attrs)) el.setAttribute(key,String(val));
    return el;
  };
  const labelFor = type => ({root:ui.all,work:ui.works,project:ui.projects,area:ui.areas,skill:ui.skills})[type] || type;
  const accent = n => colors[n.type] || "#fff";
  const statusText = n => n.status === "learning" ? ui.learning : n.status === "exploring" ? ui.exploring : n.status ? ui.applied : "";
  const setView = () => svg.setAttribute("viewBox", [view.x,view.y,view.w,view.h].join(" "));
  const aspect = () => Math.max(1.05,svg.clientWidth/Math.max(1,svg.clientHeight));
  const visible = () => {
    if (selectedType !== "all") {
      const items = graph.nodes.filter(n => n.type === selectedType || n.id === focused || n.id === "person");
      if (selectedType === "skill") return items.concat(graph.nodes.filter(n => n.type === "area" && !items.includes(n)));
      return items;
    }
    if (mode === "all") return graph.nodes;
    const neighbors = linked.get(focused) || new Set();
    return graph.nodes.filter(n => n.id === focused || neighbors.has(n.id));
  };
  const layout = () => {
    positions = new Map([[focused,{x:0,y:0}]]);
    const groups = new Map();
    nodesToDraw.filter(n=>n.id!==focused).forEach(n=>{
      const arr = groups.get(n.type)||[];arr.push(n);groups.set(n.type,arr);
    });
    const keys = ["work","area","project","skill","root"];
    let radius = 170;
    for (const key of keys) {
      const items=groups.get(key)||[];
      if(!items.length)continue;
      const circumference = Math.max(1,items.length)*118;
      const r = Math.max(radius,circumference/(2*Math.PI));
      const initial = key === "work" ? -Math.PI/3 : key === "project" ? Math.PI/8 : -Math.PI/2;
      items.forEach((n,i)=>{
        const theta = initial+2*Math.PI*i/items.length;
        positions.set(n.id,{x:Math.cos(theta)*r,y:Math.sin(theta)*r});
      });
      radius=r+195;
    }
  };
  const fit = () => {
    const coords=[...positions.values()];
    if(!coords.length)return;
    const minX=Math.min(...coords.map(p=>p.x))-110,maxX=Math.max(...coords.map(p=>p.x))+110;
    const minY=Math.min(...coords.map(p=>p.y))-100,maxY=Math.max(...coords.map(p=>p.y))+100;
    const ratio=aspect();let w=Math.max(440,maxX-minX,(maxY-minY)*ratio);
    const h=w/ratio;view={x:(minX+maxX-w)/2,y:(minY+maxY-h)/2,w,h};setView();
  };
  const select = id => {
    if(!byId.has(id))return;
    focused=id;mode="focus";selectedType="all";kind.value="all";
    modeButton.textContent=ui.full;
    search.value="";results.replaceChildren();
    render(); 
  };
  const paragraph = (tag,text,cls) => {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    el.textContent=text;
    return el;
  };
  const renderDetail=()=>{
    const node=byId.get(focused);detail.replaceChildren();
    if(!node){detail.append(paragraph("p",ui.select));return;}
    const head=paragraph("h3",node.label);detail.append(head);
    detail.append(paragraph("p",labelFor(node.type)+(node.period?" · "+node.period:"")+(node.status?" · "+statusText(node):""),"mindmap-meta"));
    detail.append(paragraph("h4",ui.descriptionHeading,"mindmap-description-heading"));
    detail.append(paragraph("p",node.description||ui.descriptionHint,"mindmap-description"));
    if(node.url && /^https:\/\/github\.com\/SolarisPKN\//.test(node.url)){
      const a=paragraph("a",ui.open+" ↗");a.href=node.url;a.target="_blank";a.rel="noopener noreferrer";detail.append(a);
    }
    const rel=relations.get(focused)||[];
    if(rel.length){
      detail.append(paragraph("h4",ui.connections+" ("+rel.length+")"));
      const list=document.createElement("div");list.className="mindmap-relations";
      rel.slice().sort((a,b)=>(byId.get(a.id).label||"").localeCompare(byId.get(b.id).label||"")).forEach(r=>{
        const n=byId.get(r.id);const button=paragraph("button",n.label);
        button.type="button";button.style.setProperty("--node-color",accent(n));
        button.addEventListener("click",()=>select(n.id),{signal});list.append(button);
      });
      detail.append(list);
    }
  };
  const render=()=>{
    nodesToDraw=visible();layout();
    const allowed=new Set(nodesToDraw.map(n=>n.id));
    const edges=validEdges.filter(e=>allowed.has(e.source)&&allowed.has(e.target));
    svg.replaceChildren();
    const edgeGroup=element("g",{"class":"mindmap-edges"});
    const nodeGroup=element("g",{"class":"mindmap-nodes"});
    edges.forEach(e=>{
      const a=positions.get(e.source),b=positions.get(e.target);
      if(!a||!b)return;
      const connected=e.source===focused||e.target===focused;
      const line=element("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
        stroke:connected?"#8ab3c3":"#64818f","stroke-opacity":connected?.62:.16,
        "stroke-width":connected?2.25:1.15});
      edgeGroup.append(line);
    });
    nodesToDraw.forEach(n=>{
      const p=positions.get(n.id);if(!p)return;
      const selected=n.id===focused;
      const g=element("g",{transform:"translate("+p.x+" "+p.y+")",
        "class":"mindmap-node"+(selected?" is-selected":""),role:"button",tabindex:"0",
        "aria-label":n.label+" · "+labelFor(n.type)});
      const radius=selected?15:n.type==="area"?12:n.type==="project"?11:9;
      const halo=element("circle",{r:radius+6,fill:accent(n),"fill-opacity":selected?".20":".07"});
      const circle=element("circle",{r:radius,fill:accent(n),stroke:selected?"white":"#102535","stroke-width":selected?2.8:1.5});
      const text=element("text",{x:0,y:-radius-12,"text-anchor":"middle","class":"mindmap-node-label"});
      const clipped=n.label.length>21?n.label.slice(0,20)+"…":n.label;
      text.textContent=clipped;
      const title=element("title");title.textContent=n.label+" · "+(n.description||ui.descriptionHint);
      g.append(halo,circle,text,title);
      g.addEventListener("click",(evt)=>{evt.stopPropagation();if(suppressClick)return;select(n.id)},{signal});
      g.addEventListener("keydown",evt=>{if(evt.key==="Enter"||evt.key===" "){evt.preventDefault();select(n.id)}},{signal});
      nodeGroup.append(g);
    });
    svg.append(edgeGroup,nodeGroup);fit();
    counter.textContent=nodesToDraw.length+" "+ui.nodes+" · "+edges.length+" "+ui.edges;
    renderDetail();
  };
  const zoom=(factor,centerX=view.x+view.w/2,centerY=view.y+view.h/2)=>{
    const w=Math.max(130,Math.min(12000,view.w*factor)),h=w/aspect();
    view={x:centerX-(centerX-view.x)*w/view.w,y:centerY-(centerY-view.y)*h/view.h,w,h};
    setView();
  };
  const matches = value => {
    const q=value.trim().toLocaleLowerCase();
    return !q?[]:graph.nodes.filter(n=>(n.label+" "+(n.description||"")).toLocaleLowerCase().includes(q)).slice(0,14);
  };
  const refreshSearch=()=>{
    results.replaceChildren();
    for(const n of matches(search.value)){
      const b=paragraph("button",n.label+" · "+labelFor(n.type));
      b.type="button";b.addEventListener("click",()=>select(n.id),{signal});results.append(b);
    }
  };
  search.addEventListener("input",refreshSearch,{signal});
  search.addEventListener("keydown",evt=>{if(evt.key==="Enter"){const m=matches(search.value)[0];if(m){evt.preventDefault();select(m.id)}}},{signal});
  kind.addEventListener("change",()=>{
    selectedType=kind.value;mode="all";modeButton.textContent=ui.focus;render();
  },{signal});
  modeButton.addEventListener("click",()=>{
    mode=mode==="all"?"focus":"all";selectedType="all";kind.value="all";
    modeButton.textContent=mode==="all"?ui.focus:ui.full;render();
  },{signal});
  host.querySelector("#mindmap-reset").addEventListener("click",()=>select("person"),{signal});
  host.querySelector("#mindmap-fit").addEventListener("click",fit,{signal});
  host.querySelector("#mindmap-plus").addEventListener("click",()=>zoom(.75),{signal});
  host.querySelector("#mindmap-minus").addEventListener("click",()=>zoom(1.33),{signal});
  svg.addEventListener("wheel",evt=>{
    evt.preventDefault();
    const rect=svg.getBoundingClientRect();
    const fx=(evt.clientX-rect.left)/rect.width,fy=(evt.clientY-rect.top)/rect.height;
    zoom(evt.deltaY<0?.86:1.16,view.x+fx*view.w,view.y+fy*view.h);
  },{signal,passive:false});
  svg.addEventListener("pointerdown",evt=>{
    if(evt.button!==0||evt.target.closest?.(".mindmap-node"))return;
    pointer={id:evt.pointerId,x:evt.clientX,y:evt.clientY,view:{...view},moved:false};
    svg.setPointerCapture(evt.pointerId);
  },{signal});
  svg.addEventListener("pointermove",evt=>{
    if(!pointer||pointer.id!==evt.pointerId)return;
    const dx=evt.clientX-pointer.x,dy=evt.clientY-pointer.y;
    if(Math.abs(dx)+Math.abs(dy)>3)pointer.moved=true;
    view.x=pointer.view.x-dx*view.w/svg.clientWidth;
    view.y=pointer.view.y-dy*view.h/svg.clientHeight;
    setView();
  },{signal});
  const finish=()=>{if(pointer?.moved){suppressClick=true;queueMicrotask(()=>suppressClick=false);}pointer=null;};
  svg.addEventListener("pointerup",finish,{signal});
  svg.addEventListener("pointercancel",finish,{signal});
  render();
  return ()=>{controller.abort();host.dataset.initialized="";svg.replaceChildren();detail.replaceChildren();results.replaceChildren();};
}
