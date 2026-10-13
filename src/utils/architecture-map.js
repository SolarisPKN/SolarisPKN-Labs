// SolarisPKN-Labs public architecture inventory.
// Relationships are sourced from public code and documentation, not inferred from private runtime state.
const I = (es, en) => ({ es, en });
const route = (p) => 'https://github.com/SolarisPKN/SolarisPKN-Labs/blob/main/' + p;

const internalNodes = [
  ['browser', 38, 62, 'runtime', I('Navegador', 'Browser'), I('Recibe HTML y archivos estáticos y consulta las estadísticas publicadas cuando están disponibles.', 'Receives HTML and static assets, and fetches published metrics when available.'), ['HTTP', 'Fetch API']],
  ['worker', 306, 62, 'runtime', I('Worker de idioma', 'Language Worker'), I('Enruta solicitudes a /es/ y /en/ y delega archivos estáticos a ASSETS. No implementa D1, KV ni R2.', 'Routes requests to /es/ and /en/ and delegates static files to ASSETS. Does not implement D1, KV or R2.'), ['Cloudflare', 'i18n'], 'src/worker.js'],
  ['assets', 574, 62, 'runtime', I('Assets públicos', 'Public assets'), I('Contenido compilado que Cloudflare sirve como sitio web estático.', 'Built content served as a static website by Cloudflare.'), ['HTML', 'CSS', 'JS'], 'wrangler.jsonc'],
  ['routes', 842, 62, 'content', I('Páginas ES/EN', 'ES/EN pages'), I('Páginas de proyectos, blog, arquitectura, portfolio y categorías en dos idiomas.', 'Project, blog, architecture, portfolio and category pages in two languages.'), ['Astro', 'Routes'], 'src/pages/[lang]/arquitectura.astro'],
  ['repo', 38, 293, 'build', I('Código del sitio', 'Site source'), I('Componentes Astro, estilos, scripts, rutas y configuración versionados en GitHub.', 'Astro components, styles, scripts, routes and configuration versioned on GitHub.'), ['GitHub', 'Source'], 'README.md'],
  ['build', 306, 293, 'build', I('Compilación Astro', 'Astro build'), I('Genera páginas HTML a partir del código y los contenidos en el momento de compilar.', 'Builds HTML pages from source and content at build time.'), ['Astro 7', 'Static'], 'package.json'],
  ['catalog', 38, 524, 'content', I('Registro de proyectos', 'Project registry'), I('Cada carpeta de src/content/projects aporta project.json y documentación bilingüe.', 'Each folder in src/content/projects provides project.json and bilingual documentation.'), ['project.json', 'MDX'], 'src/utils/projects.js'],
  ['explainer', 306, 524, 'content', I('Fichas y explainers', 'Project explainers'), I('Resuelve componentes personalizados, JSON de explicación o MDX para construir fichas técnicas.', 'Resolves custom components, JSON explainers or MDX to build project detail pages.'), ['Astro', 'MDX', 'JSON'], 'src/pages/[lang]/projects/[slug].astro'],
  ['editor', 574, 524, 'editorial', I('Editor de blog local', 'Local blog editor'), I('Servidor local de edición de publicaciones; no es un panel administrativo público.', 'Local post editor server; it is not a public administration console.'), ['localhost', 'Node.js'], 'scripts/post-editor/server.js'],
  ['blog', 842, 524, 'editorial', I('Publicaciones', 'Blog content'), I('Entradas del blog guardadas en archivos de contenido, incorporadas en la compilación.', 'Blog posts stored in content files and included in the build.'), ['Posts', 'MDX'], 'src/pages/[lang]/blog/index.astro'],
  ['sources', 38, 754, 'metrics', I('Fuentes de métricas', 'Metric sources'), I('GitHub, Cloudflare y PageSpeed: fuentes externas de estadísticas según los conectores disponibles.', 'GitHub, Cloudflare and PageSpeed: external statistics sources depending on available connectors.'), ['GitHub', 'Cloudflare', 'PSI']],
  ['stats', 306, 754, 'metrics', I('SolarisPKN-Stats', 'SolarisPKN-Stats'), I('Recolecta y publica métricas en otro repositorio. Labs no es el recolector.', 'Collects and publishes metrics in a separate repository. Labs is not the collector.'), ['External repo', 'Connectors']],
  ['snapshot', 574, 754, 'metrics', I('Stats.json público', 'Public Stats.json'), I('Archivo JSON publicado por proyecto. Puede faltar mientras se incorporan conectores.', 'Per-project published JSON. May be missing while connectors are being added.'), ['JSON', 'Versioned']],
  ['renderer', 842, 754, 'metrics', I('Visualización de métricas', 'Metrics visualization'), I('El JavaScript de la ficha solicita Stats.json al navegador y presenta únicamente datos existentes.', 'Project page JavaScript requests Stats.json in the browser and displays only available values.'), ['Fetch', 'UI'], 'src/pages/[lang]/projects/[slug].astro'],
  ['ci', 574, 293, 'build', I('Pruebas y validación', 'Tests and validation'), I('Workflow de pull requests para pruebas del catálogo, diagnósticos de Astro y compilación.', 'Pull request workflow for catalog tests, Astro diagnostics and production builds.'), ['GitHub Actions', 'CI'], '.github/workflows/validate-site.yml'],
  ['mirrors', 842, 293, 'build', I('Réplicas del repositorio', 'Repository mirrors'), I('Workflows de sincronización de código hacia forjas externas; no son parte de las solicitudes web.', 'Code synchronization workflows for external forges; not part of web requests.'), ['Git mirrors', 'Actions'], '.github/workflows/mirror-codeberg.yml'],
];
const internalEdges = [
  ['browser','worker','http'], ['worker','assets','assets'], ['assets','routes','serve'],
  ['repo','build','source'], ['ci','repo','checks'], ['repo','ci','pipeline'],
  ['repo','mirrors','mirror'], ['catalog','build','metadata'], ['catalog','explainer','metadata'],
  ['explainer','build','detail'], ['editor','blog','local authoring'], ['blog','build','content'],
  ['build','assets','output'], ['sources','stats','external APIs'],
  ['stats','snapshot','publishes'], ['snapshot','renderer','browser fetch'],
  ['renderer','browser','UI'],
];

const futureNodes = [
  ['future-api', 38, 105, 'planned', I('API privada', 'Private API'), I('Posible backend autenticado. No implementado en SolarisPKN-Labs.', 'Potential authenticated backend. Not implemented in SolarisPKN-Labs.')],
  ['future-d1', 306, 105, 'planned', I('Cloudflare D1', 'Cloudflare D1'), I('Persistencia de usuarios o productos, únicamente como propuesta.', 'User or product persistence, only a proposal.')],
  ['future-kv', 574, 105, 'planned', I('Cloudflare KV', 'Cloudflare KV'), I('Posible caché o almacenamiento de estado. No está configurado en este repositorio.', 'Potential cache or state storage. Not configured in this repository.')],
  ['future-r2', 842, 105, 'planned', I('Cloudflare R2', 'Cloudflare R2'), I('Posible almacenamiento de archivos; no hay binding R2 de Labs verificado.', 'Potential file storage; no verified Labs R2 binding.')],
  ['future-auth', 306, 330, 'planned', I('Cuentas y licencias', 'Accounts and licenses'), I('Idea anterior de cuentas, licencias y distribución: no se debe mostrar como funcional.', 'Older account, licensing and distribution idea: must not be shown as functional.')],
];

const verifiedConnections = [
  ['SolarisPKN-Stats','solarispkn-labs', 'metrics', I('Stats.json para fichas', 'Stats.json for project cards'), 'src/pages/[lang]/projects/[slug].astro'],
  ['SolarisPKN-Engineer','solarispkn-labs', 'documentation', I('Ejemplo de análisis público', 'Public analysis example'), 'https://github.com/SolarisPKN/SolarisPKN-Engineer/tree/main/ejemplos/SolarisPKN-Labs'],
  ['SolarisPKN-Transport','Villars-Informa', 'data', I('Exportación de horarios', 'Timetable exports'), 'https://github.com/SolarisPKN/Villars-Informa/blob/main/README.md'],
  ['Figma-Lab','SolarisPKN-Stats', 'prototype', I('Prototipo de interfaz', 'Interface prototype'), 'https://github.com/SolarisPKN/Figma-Lab/blob/main/src/App.tsx'],
];

function label(v, lang) { return v && typeof v === 'object' ? v[lang] || v.es || '' : String(v || ''); }
function makeInternal(n, lang) {
  const [id,x,y,group,name,desc,chips,source] = n;
  return {id,x,y,group,label:label(name,lang),description:label(desc,lang),chips:chips||[],status:group==='planned'?'planned':'implemented',source:source?(source.startsWith('https:')?source:route(source)):null};
}
function makeGraph(id,nodes,edges,width,height) {
  const ids = new Set(nodes.map(n=>n.id));
  return {id,width,height,nodes,edges:edges.filter(e=>ids.has(e.from)&&ids.has(e.to))};
}
function relation(source,target,type,labelText,proof) {
  return {from:source,to:target,kind:type,label:labelText,source:proof.startsWith('https:')?proof:route(proof)};
}
export function buildArchitectureMap(projects, lang='es') {
  lang = lang === 'en' ? 'en' : 'es';
  const internal=makeGraph('internal',internalNodes.map(n=>makeInternal(n,lang)),
    internalEdges.map(([from,to,label])=>({from,to,label,kind:'documented'})),1090,1010);
  const sorted = ['core','derived','external'].flatMap(category =>
    projects.filter(p=>p.category===category).sort((a,b)=>a.slug.localeCompare(b.slug)));
  const hubs=[
    {id:'hub-core',x:84,y:35,group:'hub',category:'core',label:'Core Labs',description:lang==='es'?'Proyectos de identidad SolarisPKN.':'SolarisPKN identity projects.',chips:[],status:'catalog'},
    {id:'hub-derived',x:429,y:35,group:'hub',category:'derived',label:'Derived Labs',description:lang==='es'?'Iniciativas propias de otras marcas.':'Independent-brand projects.',chips:[],status:'catalog'},
    {id:'hub-external',x:774,y:35,group:'hub',category:'external',label:'External Labs',description:lang==='es'?'Prototipos y experiencias en plataformas de terceros.':'Third-party platform experiments.',chips:[],status:'catalog'},
  ];
  const categoryX={core:84,derived:429,external:774};
  const count={core:0,derived:0,external:0};
  const ecoNodes=sorted.map(project=>{
    const category=project.category;
    const item={
      id:project.slug, x:categoryX[category], y:148+count[category]*102,
      group:category, category, label:label(project.name,lang)||project.slug,
      description:label(project.shortDescription,lang),
      chips:Array.isArray(project.technologies)?project.technologies.slice(0,4):[],
      status:project.status||'development',
      url:'/'+lang+'/projects/'+encodeURIComponent(project.slug)+'/',
      source:project.links?.github||null
    };
    count[category]++;
    return item;
  });
  const members=ecoNodes.map(p=>({from:'hub-'+p.group,to:p.id,kind:'catalog',label:'catalog'}));
  const mapNodes=[...hubs,...ecoNodes];
  const known=new Set(mapNodes.map(n=>n.id));
  const relationships=verifiedConnections
   .filter(r=>known.has(r[0])&&known.has(r[1]))
   .map(r=>relation(r[0],r[1],r[2],label(r[3],lang),r[4]));
  const maxCount=Math.max(...Object.values(count),1);
  const ecosystem=makeGraph('ecosystem',mapNodes,[...members,...relationships],1100,Math.max(520,186+maxCount*102));
  const planned=makeGraph('planned',futureNodes.map(n=>makeInternal(n,lang)),
    [['future-api','future-d1'],['future-api','future-kv'],['future-api','future-r2'],['future-api','future-auth']]
      .map(([from,to])=>({from,to,label:lang==='es'?'propuesto':'proposed',kind:'planned'})),1090,590);
  return {internal,ecosystem,planned,relationships,counts:count,totalProjects:ecoNodes.length,internalCount:internal.nodes.length};
}
