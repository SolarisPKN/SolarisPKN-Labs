// Public Labs interactions; all write operations remain server-authenticated.
let challengeScript;
function ensureTurnstile(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 if(!challengeScript)challengeScript=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  script.onload=()=>window.turnstile?resolve(window.turnstile):reject(Error('turnstile_unavailable'));
  script.onerror=()=>reject(Error('turnstile_unavailable'));
  document.head.append(script);
 });
 return challengeScript;
}
async function getJson(path,body){
 const options={credentials:'same-origin',cache:'no-store'};
 if(body!==undefined){options.method='POST';options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body);}
 const response=await fetch(path,options);
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'service_error');
 return data;
}
function makeElement(tag,text){
 const e=document.createElement(tag);e.textContent=text;return e;
}
async function projectActions(container){
 if(container.dataset.ready)return;container.dataset.ready='yes';
 const project=container.dataset.project;
 const language=container.dataset.lang==='en'?'en':'es';
 const feedback=container.querySelector('[data-project-feedback]');
 const message=text=>feedback.textContent=text;
 try{
  const status=await getJson('/api/account/status');
  if(!status.enabled){message(language==='en'?'Account actions are not enabled yet.':'Las acciones de cuenta todavía no están habilitadas.');return;}
  const me=await getJson('/api/account/me');
  if(!me.authenticated){message(language==='en'?'Sign in to save or follow this project.':'Iniciá sesión para guardar o seguir este proyecto.');return;}
  const [favorite,follow]=await Promise.all([getJson('/api/account/favorites'),getJson('/api/account/follows')]);
  const states={favorites:favorite.items.some(x=>x.project===project),follows:follow.items.some(x=>x.project===project)};
  for(const type of ['favorites','follows']){
   const button=container.querySelector('[data-community-'+type+']');button.hidden=false;
   const update=()=>{
    const flag=states[type];
    button.textContent=type==='favorites'
      ?(flag?(language==='en'?'★ Saved':'★ Guardado'):(language==='en'?'☆ Save':'☆ Guardar'))
      :(flag?(language==='en'?'✓ Following':'✓ Siguiendo'):(language==='en'?'+ Follow':'+ Seguir'));
    button.setAttribute('aria-pressed',String(flag));
   };
   update();
   button.addEventListener('click',async()=>{
    if(button.disabled)return;button.disabled=true;
    try{await getJson('/api/account/'+type,{project,action:states[type]?'remove':'add'});states[type]=!states[type];update();message(language==='en'?'Saved successfully.':'Guardado correctamente.');}
    catch(e){message(language==='en'?'Action unavailable.':'No se pudo realizar la acción.');}
    finally{button.disabled=false;}
   });
  }
  message('');
 }catch{message(language==='en'?'Account actions are temporarily unavailable.':'Acciones de cuenta no disponibles temporalmente.');}
}
async function comments(container){
 if(container.dataset.ready)return;container.dataset.ready='yes';
 const language=container.dataset.lang==='en'?'en':'es',post=container.dataset.post;
 const feedback=container.querySelector('[data-comment-feedback]');
 const listing=container.querySelector('[data-comment-list]');
 const form=container.querySelector('[data-comment-form]');
 const submit=form.querySelector('button[type=submit]');
 const setStatus=text=>feedback.textContent=text;
 try{
  const status=await getJson('/api/account/status');
  if(!status.enabled){setStatus(language==='en'?'Comments are not enabled yet.':'Los comentarios todavía no están habilitados.');return;}
  const [data,me]=await Promise.all([getJson('/api/comments?post='+encodeURIComponent(post)),getJson('/api/account/me')]);
  listing.replaceChildren();
  if(!data.comments.length)listing.append(makeElement('li',language==='en'?'No published comments.':'Todavía no hay comentarios publicados.'));
  for(const item of data.comments){
   const li=document.createElement('li');
   li.append(makeElement('strong',item.author+' · '));
   li.append(makeElement('time',new Date(item.createdAt*1000).toLocaleDateString(language==='en'?'en-US':'es-AR')));
   li.append(makeElement('p',item.text));
   listing.append(li);
  }
  if(!me.authenticated){setStatus(language==='en'?'Sign in to comment.':'Iniciá sesión para comentar.');return;}
  form.hidden=false;
  const turnstile=await ensureTurnstile();
  if(!container.isConnected)return;
  const widget=turnstile.render(container.querySelector('[data-comment-verification]'),{sitekey:status.turnstileSiteKey,theme:'dark',action:'comment'});
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(submit.disabled)return;
   const token=turnstile.getResponse(widget);
   if(!token){setStatus(language==='en'?'Complete the verification.':'Completá la verificación.');return;}
   submit.disabled=true;
   try{
    await getJson('/api/comments',{post,text:form.querySelector('textarea').value,turnstile:token});
    form.querySelector('textarea').value='';
    setStatus(language==='en'?'Sent for moderation; not public yet.':'Enviado a moderación; todavía no es público.');
   }catch{setStatus(language==='en'?'Could not publish the comment.':'No se pudo enviar el comentario.');}
   finally{turnstile.reset(widget);submit.disabled=false;}
  });
  setStatus('');
 }catch{setStatus(language==='en'?'Comments unavailable.':'Comentarios no disponibles.');}
}
function initialize(){
 document.querySelectorAll('[data-labs-project-actions]').forEach(el=>void projectActions(el));
 document.querySelectorAll('[data-labs-comments]').forEach(el=>void comments(el));
}
document.addEventListener('astro:page-load',initialize);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
