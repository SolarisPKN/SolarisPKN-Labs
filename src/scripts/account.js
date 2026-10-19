// No third-party SDK, browser storage of credentials, or HTML injection.
const $=(r,s)=>r.querySelector(s);
async function api(url,body){
 const opts={credentials:'same-origin',cache:'no-store'};
 if(body!==undefined){opts.method='POST';opts.headers={'Content-Type':'application/json'};opts.body=JSON.stringify(body);}
 const r=await fetch(url,opts);
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||'request_failed');
 return data;
}
let loader;
async function loadTurnstile(){
 if(window.turnstile)return window.turnstile;
 if(!loader)loader=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.async=true;
   script.onload=()=>window.turnstile?resolve(window.turnstile):reject(Error('verification_unavailable'));
   script.onerror=()=>reject(Error('verification_unavailable'));
   document.head.append(script);
 });
 return loader;
}
function label(name,value){
 const element=document.createElement(name);element.textContent=String(value);return element;
}
function accountReady(root){
 if(root.dataset.ready)return;
 root.dataset.ready='1';
 const lang=root.dataset.lang==='en'?'en':'es',en=lang==='en';
 const message=$ (root,'[data-identity-message]');
 const say=text=>{message.hidden=false;message.textContent=text;};
 const views=['disabled','login','dashboard'];
 const show=view=>views.forEach(x=>{$(root,'[data-identity-'+x+']').hidden=x!==view;});
 const widgets={};let status;
 const challenge=type=>window.turnstile?.getResponse(widgets[type])||'';
 const refresh=type=>{if(widgets[type]!==undefined)window.turnstile?.reset(widgets[type]);};
 async function widget(type){
   if(widgets[type]!==undefined)return;
   const site=$ (root,'[data-identity-turnstile="'+type+'"]');
   const t=await loadTurnstile();
   if(!root.isConnected)return;
   widgets[type]=t.render(site,{sitekey:status.turnstileSiteKey,theme:'dark',action:type});
 }
 function renderList(selector,items,kind){
  const ul=$(root,selector);ul.replaceChildren();
  if(!items.length){ul.append(label('li',en?'No items yet':'Todavía no hay elementos'));return;}
  items.forEach(item=>{
   const li=document.createElement('li');
   if(kind==='comments'){
    li.textContent=item.post_slug+' — '+item.body.slice(0,120)+' ['+item.status+']';
   }else{
    const a=label('a',item.project);
    a.href='/'+lang+'/projects/'+encodeURIComponent(item.project)+'/';
    li.append(a);
   }
   ul.append(li);
  });
 }
 async function dashboard(){
   const me=await api('/api/account/me');
   if(!me.authenticated){show('login');await widget('login');return;}
   show('dashboard');
   $(root,'[data-identity-profile]').textContent='ID '+me.user.id;
   $(root,'[data-identity-methods]').textContent=(en?'Providers: ':'Proveedores: ')+me.providers.join(', ');
   $(root,'#identity-alias').value=me.user.alias||'';
   $(root,'#identity-language').value=me.preferences.language;
   $(root,'#identity-theme').value=me.preferences.theme;
   const data=await Promise.all([api('/api/account/favorites'),api('/api/account/follows'),api('/api/account/comments')]);
   renderList('[data-identity-favorites]',data[0].items,'favorites');
   renderList('[data-identity-follows]',data[1].items,'follows');
   renderList('[data-identity-comments]',data[2].items,'comments');
   await widget('sensitive');
 }
 const bind=(selector,fn)=>{
  const btn=$(root,selector);
  btn.addEventListener('click',async()=>{
   if(btn.disabled)return;btn.disabled=true;
   try{await fn();}catch(error){say(error.message||'service_unavailable');}
   finally{btn.disabled=false;}
  });
 };
 bind('[data-identity-logout]',async()=>{
  await api('/api/account/logout',{});location.assign('/'+lang+'/mi-cuenta/');
 });
 bind('[data-identity-alias-save]',async()=>{
  await api('/api/account/profile',{alias:$(root,'#identity-alias').value});
  say(en?'Saved':'Guardado');await dashboard();
 });
 bind('[data-identity-preferences-save]',async()=>{
  await api('/api/account/preferences',{language:$(root,'#identity-language').value,theme:$(root,'#identity-theme').value});
  say(en?'Saved':'Guardado');
 });
 bind('[data-identity-export]',async()=>{
  const data=await api('/api/account/export');
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='solarispkn-account-export.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 bind('[data-identity-delete]',async()=>{
  const typed=prompt(en?'Type DELETE to permanently delete the account:':'Escribí ELIMINAR para borrar la cuenta definitivamente:');
  if(typed!==(en?'DELETE':'ELIMINAR'))return;
  if(!challenge('sensitive')){say(en?'Complete verification':'Completá la verificación');return;}
  try{
   await api('/api/account/delete',{confirm:'DELETE',turnstile:challenge('sensitive')});
   location.assign('/'+lang+'/mi-cuenta/');
  }catch(e){refresh('sensitive');throw e;}
 });
 async function run(){
  try{
   status=await api('/api/account/status');
   if(!status.enabled){show('disabled');say(en?'Registration is securely disabled until setup is completed.':'El registro está deshabilitado hasta completar la configuración segura.');return;}
   const box=$(root,'[data-identity-providers]');box.replaceChildren();
   for(const provider of status.providers){
    const b=label('button',({google:'Google',github:'GitHub',microsoft:'Microsoft',yandex:'Yandex'})[provider]||provider);
    b.type='button';
    b.addEventListener('click',async()=>{
     if(b.disabled)return;
     b.disabled=true;
     try{
      const response=challenge('login');
      if(!response){say(en?'Complete verification first':'Completá la verificación');return;}
      const result=await api('/api/auth/start',{provider,turnstile:response});
      const destination=new URL(result.authorize);
      if(destination.protocol!=='https:'||!['accounts.google.com','github.com','login.microsoftonline.com','oauth.yandex.com'].includes(destination.hostname))throw Error('invalid_redirect');
      location.assign(destination.toString());
     }catch(e){say(e.message);refresh('login');}
     finally{b.disabled=false;}
    });
    box.append(b);
   }
   const callback=new URLSearchParams(location.search).get('auth');
   if(callback==='failed')say(en?'Sign-in failed':'No se pudo iniciar sesión');
   else if(callback==='success')say(en?'Signed in successfully':'Ingreso exitoso');
   else message.hidden=true;
   await dashboard();
  }catch(e){show('disabled');say(en?'Service not available':'Servicio no disponible');}
 }
 void run();
}
function runAll(){document.querySelectorAll('[data-labs-account]').forEach(accountReady);}
document.addEventListener('astro:page-load',runAll);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',runAll,{once:true});
else runAll();
