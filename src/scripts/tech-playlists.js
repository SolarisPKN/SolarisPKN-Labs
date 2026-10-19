// @ts-nocheck
// Live public YouTube playlists: no YouTube Data API key required.
function readyYouTubePlayer(){
 return new Promise((resolve,reject)=>{
  if(window.YT && typeof window.YT.Player==='function')return resolve(window.YT);
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){
   if(typeof previous==='function')previous();
   resolve(window.YT);
  };
  if(!document.querySelector('script[data-tech-yt-api]')){
   const script=document.createElement('script');
   script.dataset.techYtApi='1';
   script.async=true;
   script.src='https://www.youtube.com/iframe_api';
   script.onerror=()=>reject(new Error('youtube-api-unavailable'));
   document.head.appendChild(script);
  }
  setTimeout(()=>reject(new Error('youtube-api-timeout')),12000);
 });
}
function initializeTechPlaylists(){
 document.querySelectorAll('[data-tech-playlists]').forEach(root=>{
  if(root.dataset.initialized==='1')return;
  root.dataset.initialized='1';
  const configElement=root.querySelector('[data-tech-config]');
  if(!configElement)return;
  const {playlistInfo,words}=JSON.parse(configElement.textContent);
  const tabs=[...root.querySelectorAll('[data-playlist]')];
  const queue=root.querySelector('[data-video-list]');
  const count=root.querySelector('[data-video-count]');
  const warning=root.querySelector('[data-video-warning]');
  const placeholder=root.querySelector('[data-video-placeholder]');
  const title=root.querySelector('[data-video-title]');
  const description=root.querySelector('[data-video-description]');
  const playlistLink=root.querySelector('[data-video-link]');
  const moreLink=root.querySelector('[data-video-more]');
  const holder=root.querySelector('[data-video-holder]');
  const VIDEO_ID=/^[a-zA-Z0-9_-]{11}$/;
  let selected=0;
  let generation=0;
  let player=null;
  let liveIds=[];
  let recent=[];
  let currentIds=[];
  let pollTimer=null;
  let disposed=false;
  let titlesObserver=null;
  const titleCache=new Map();
  async function enrichTitle(button,video,gen){
   const cached=titleCache.get(video.id);
   if(cached){
    const titleEl=button.querySelector('.tech-queue-item-title');
    if(titleEl)titleEl.textContent=cached;
    return;
   }
   try{
    const response=await fetch('/api/tech-video-title?id='+encodeURIComponent(video.id));
    if(!response.ok)return;
    const data=await response.json();
    if(gen!==generation||disposed||!data.ok||typeof data.title!=='string')return;
    titleCache.set(video.id,data.title);
    video.title=data.title;
    const titleEl=button.querySelector('.tech-queue-item-title');
    if(button.isConnected&&titleEl)titleEl.textContent=data.title;
   }catch{}
  }

  function setCount(n){
   count.textContent=n?words.videoCount+': '+n:words.videoLoading;
  }
  function setActive(index){
   selected=index;
   const info=playlistInfo[index];
   tabs.forEach((tab,i)=>{
    tab.classList.toggle('chosen',i===index);
    tab.setAttribute('aria-pressed',String(i===index));
   });
   title.textContent=info.title;
   description.textContent=info.description;
   playlistLink.href=info.url;
   moreLink.href=info.url;
  }
  function draw(items){
   if(disposed)return;
   const parent=document.createDocumentFragment();
   if(!items.length){
     const p=document.createElement('p');
     p.className='tech-queue-message';
     p.textContent=words.videoUnavailable;
     parent.append(p);
   }
   items.forEach((video,index)=>{
     const button=document.createElement('button');
     button.type='button';
     button.className='tech-queue-item';
     button.setAttribute('role','listitem');
     button.dataset.videoId=video.id;
     const thumb=document.createElement('img');
     thumb.alt='';
     thumb.width=112;thumb.height=63;
     thumb.loading='lazy';
     thumb.src='https://i.ytimg.com/vi/'+video.id+'/mqdefault.jpg';
     const detail=document.createElement('span');
     detail.className='tech-queue-item-info';
     const label=document.createElement('span');
     label.className='tech-queue-item-title';
     label.textContent=video.title||words.videoFallback+' '+(index+1);
     const seq=document.createElement('span');
     seq.className='tech-queue-item-index';
     seq.textContent=String(index+1).padStart(2,'0');
     detail.append(label,seq);
     button.append(thumb,detail);
     button.addEventListener('click',()=>{
      if(player && typeof player.playVideoAt==='function' && liveIds.includes(video.id)){
       player.playVideoAt(liveIds.indexOf(video.id)); // user gesture, playlist order preserved
      }else if(player && typeof player.loadVideoById==='function'){
       player.loadVideoById(video.id); // public recent feed fallback
      }else{
       window.open('https://www.youtube.com/watch?v='+encodeURIComponent(video.id),'_blank','noopener');
      }
      queue.querySelectorAll('.tech-queue-item').forEach(x=>x.classList.toggle('current',x.dataset.videoId===video.id));
     });
     parent.append(button);
   });
   titlesObserver?.disconnect();
   queue.replaceChildren(parent);
   setCount(items.length);
   // Titles outside YouTube's recent public feed are fetched lazily while
   // their cards become visible; no API key, and no request flood on load.
   const gen=generation;
   const buttons=[...queue.querySelectorAll('.tech-queue-item')];
   if('IntersectionObserver' in window){
    titlesObserver=new IntersectionObserver((entries,observer)=>{
      for(const entry of entries){
       if(!entry.isIntersecting)continue;
       observer.unobserve(entry.target);
       const i=buttons.indexOf(entry.target);
       if(i>=0&&!items[i].title)enrichTitle(entry.target,items[i],gen);
      }
    },{root:queue,rootMargin:'120px'});
    buttons.forEach((button,i)=>{if(!items[i].title)titlesObserver.observe(button);});
   }else{
    buttons.slice(0,12).forEach((button,i)=>{if(!items[i].title)enrichTitle(button,items[i],gen);});
   }
  }
  function drawCombined(){
   const titles=new Map([...titleCache,...recent.map(v=>[v.id,v.title])]);
   // getPlaylist() returns the currently available IDs in the official embedded player.
   // RSS is a recent-only fallback, never falsely labeled as the entire archive.
   const ids=liveIds.length?liveIds:recent.map(v=>v.id);
   currentIds=ids.map(id=>({id,title:titles.get(id)||''})).filter(x=>VIDEO_ID.test(x.id));
   draw(currentIds);
   warning.hidden=liveIds.length>0;
  }
  function pollList(gen,tries=0){
   if(disposed||gen!==generation||!player)return;
   const ids=typeof player.getPlaylist==='function'?player.getPlaylist():null;
   if(Array.isArray(ids) && ids.some(id=>VIDEO_ID.test(id))){
     const cleaned=[...new Set(ids.filter(id=>VIDEO_ID.test(id)))];
     if(cleaned.join('|')!==liveIds.join('|')){
      liveIds=cleaned;
      drawCombined();
     }
     if(tries>=12)return;
   }
   if(tries<20)pollTimer=setTimeout(()=>pollList(gen,tries+1),350);
   else drawCombined();
  }
  async function loadRecent(gen,index){
   try{
     const response=await fetch('/api/tech-playlist?list='+encodeURIComponent(playlistInfo[index].key),{cache:'no-store'});
     if(!response.ok)throw new Error('public-feed-unavailable');
     const data=await response.json();
     if(gen!==generation||disposed)return;
     recent=Array.isArray(data.videos)?data.videos.filter(x=>VIDEO_ID.test(x.id)): [];
     drawCombined();
   }catch{
     if(gen!==generation||disposed)return;
     if(!liveIds.length)draw([]);
   }
  }
  function select(index){
   if(index<0||index>=playlistInfo.length)return;
   generation++;
   clearTimeout(pollTimer);
   liveIds=[];recent=[];currentIds=[];
   setActive(index);
   queue.textContent=words.videoLoading;
   warning.hidden=true;
   loadRecent(generation,index);
   if(player && typeof player.cuePlaylist==='function'){
     player.cuePlaylist({listType:'playlist',list:playlistInfo[index].id,index:0,startSeconds:0});
     pollList(generation);
   }
  }
  tabs.forEach((button,index)=>button.addEventListener('click',()=>select(index)));
  const track=()=>{
    if(player?.getPlaylistIndex && currentIds.length && liveIds.length){
      const active=liveIds[player.getPlaylistIndex()];
      queue.querySelectorAll('.tech-queue-item').forEach(x=>x.classList.toggle('current',x.dataset.videoId===active));
    }
    pollList(generation);
  };
  readyYouTubePlayer().then(YT=>{
    if(disposed||!holder.isConnected)return;
    player=new YT.Player(holder,{
      width:'100%',height:'100%',
      playerVars:{listType:'playlist',list:playlistInfo[selected].id,playsinline:1,rel:0,origin:location.origin},
      events:{
       onReady:()=>{
         if(disposed)return;
         placeholder.hidden=true;
         player.cuePlaylist({listType:'playlist',list:playlistInfo[selected].id,index:0,startSeconds:0});
         pollList(generation);
       },
       onStateChange:()=>track()
      }
    });
  }).catch(()=>{
    if(disposed)return;
    placeholder.querySelector('p').textContent=words.videoUnavailable;
  });
  select(0);
  const cleanup=()=>{disposed=true;titlesObserver?.disconnect();clearTimeout(pollTimer);if(player?.destroy)player.destroy();document.removeEventListener('astro:before-swap',cleanup);};
  document.addEventListener('astro:before-swap',cleanup,{once:true});
 });
}
document.addEventListener('astro:page-load',initializeTechPlaylists);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeTechPlaylists,{once:true});
else initializeTechPlaylists();
