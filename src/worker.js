import {fetchRecentPublicPlaylist} from './utils/tech-playlist-feed.js';
const supportedLanguages = new Set(['es', 'en']);

function getPreferredLanguage(header) {
  const preferences = header
    .split(',')
    .map((entry, index) => {
      const [tag = '', ...parameters] = entry.trim().toLowerCase().split(';');
      const language = tag.split('-')[0];
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
      const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.split('=')[1]) : 1;
      const quality = Number.isFinite(parsedQuality) ? parsedQuality : 0;
      return { language, quality, index };
    })
    .filter(({ language, quality }) => supportedLanguages.has(language) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return preferences[0]?.language ?? 'es';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Public oEmbed titles for videos already visible in the playlist sidebar.
    // Fixed upstream host + validated video IDs; no Data API credential required.
    if(path === '/api/tech-video-title'){
      if(request.method !== 'GET')return new Response('Method not allowed',{status:405});
      const id=url.searchParams.get('id')||'';
      if(!/^[A-Za-z0-9_-]{11}$/.test(id))return Response.json({ok:false},{status:400});
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),6000);
        let upstream;
        try{
          const api='https://www.youtube.com/oembed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id)+'&format=json';
          upstream=await fetch(api,{signal:controller.signal,headers:{Accept:'application/json'}});
        }finally{clearTimeout(timer);}
        if(!upstream.ok)return Response.json({ok:false},{status:502});
        const metadata=await upstream.json();
        const title=typeof metadata.title==='string'?metadata.title.trim().slice(0,250):'';
        if(!title)return Response.json({ok:false},{status:502});
        return Response.json({ok:true,id,title},{headers:{'Cache-Control':'public, max-age=300'}});
      }catch{return Response.json({ok:false},{status:502});}
    }

    // Fresh public videos for the technology / automotive sidebar.
    // No secrets or user-input upstream URLs; only two whitelisted playlists.
    if(path === '/api/tech-playlist'){
      if(request.method !== 'GET')return new Response('Method not allowed',{status:405,headers:{'Allow':'GET'}});
      const name=url.searchParams.get('list')||'';
      const data=await fetchRecentPublicPlaylist(name);
      return new Response(JSON.stringify(data),{
        status:data.ok?200:data.status,
        headers:{'Content-Type':'application/json; charset=utf-8',
          'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
      });
    }

    // 1. Archivos estáticos → servir directamente
    if (/\.(?:html|css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|pdf)$/i.test(path)) {
      return env.ASSETS.fetch(request);
    }

    const segments = path.split('/').filter(Boolean);

    // 2. Si ya tiene /es/ o /en/ como prefijo...
    if (segments.length > 0 && (segments[0] === 'es' || segments[0] === 'en')) {
      // 2a. ...pero le falta la barra final → redirigir para agregarla
      if (!path.endsWith('/')) {
        const newUrl = new URL(url);
        newUrl.pathname = path + '/';
        return Response.redirect(newUrl.toString(), 301);
      }
      // 2b. Ya está bien formada → servir directo
      return env.ASSETS.fetch(request);
    }

    // 3. Detectar idioma preferido
    const targetLang = getPreferredLanguage(request.headers.get('accept-language') || '');

    // 4. Redirigir a /es/ o /en/, garantizando la barra final, en un solo salto
    let newPath = `/${targetLang}${path}`;
    if (!newPath.endsWith('/')) newPath += '/';
    return Response.redirect(new URL(newPath, url), 301);
  }
};