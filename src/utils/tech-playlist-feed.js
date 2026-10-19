// Public YouTube Atom feed parser. It contains recent playlist entries (usually
// <= 15), not a guaranteed complete archive. The IFrame Player API supplies
// playlist IDs for the longer live queue with no YouTube Data API key.
export const PLAYLISTS=Object.freeze({
 pc:'PLVxh46uVOYfb5YCI8AqG5jK_TB8p0vu9D',
 auto:'PLVxh46uVOYfYbTsYFmaZ31w8AyCOs9yuG'
});
const idPattern=/^[a-zA-Z0-9_-]{11}$/;
export function decodeText(s){
 return String(s).replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi,(_,numeric,name)=>{
  if(numeric){const cp=numeric[0].toLowerCase()==='x'?parseInt(numeric.slice(1),16):parseInt(numeric,10);
   return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):'';}
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[name.toLowerCase()]||'';
 });
}
export function parsePublicFeed(xml){
 const entries=[];
 const tags=String(xml).match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/g)||[];
 for(const [index,entry] of tags.entries()){
  const id=entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
  const title=entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if(!idPattern.test(id||'')||!title)continue;
  const published=entry.match(/<published>([^<]+)<\/published>/)?.[1]||'';
  const decoded=decodeText(title).trim();
  if(!decoded||/^(Private video|Deleted video)$/i.test(decoded))continue;
  entries.push({id,title:decoded.slice(0,250),date:published,position:index});
 }
 return entries;
}
export async function fetchRecentPublicPlaylist(key,fetchFn=fetch){
 const id=PLAYLISTS[key];
 if(!id)return {ok:false,status:404,error:'unknown-playlist'};
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),7000);
  let response;
  try{
   response=await fetchFn('https://www.youtube.com/feeds/videos.xml?playlist_id='+encodeURIComponent(id),{
    headers:{'Accept':'application/atom+xml, application/xml, text/xml'},
    signal:controller.signal,
    redirect:'follow'
   });
  }finally{clearTimeout(timeout);}
  if(!response.ok)return {ok:false,status:502,error:'youtube-feed-unavailable'};
  const xml=await response.text();
  if(!xml.includes('<feed')||xml.length>512000)return {ok:false,status:502,error:'invalid-public-feed'};
  return {ok:true,source:'youtube-public-feed',partial:true,videos:parsePublicFeed(xml)};
 }catch{return {ok:false,status:502,error:'youtube-feed-unavailable'};}
}
