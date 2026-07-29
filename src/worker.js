export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Archivos estáticos → servir directamente
    if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|pdf)$/i.test(path)) {
      return env.ASSETS.fetch(request);
    }

    // 2. Si ya tiene /es/ o /en/ → servir la página
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && (segments[0] === 'es' || segments[0] === 'en')) {
      return env.ASSETS.fetch(request);
    }

    // 3. Detectar idioma preferido
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferEn = acceptLanguage.startsWith('en');
    const targetLang = preferEn ? 'en' : 'es';

    // 4. Redirigir a /es o /en
    const newPath = `/${targetLang}${path}`;
    return Response.redirect(new URL(newPath, url), 302);
  }
};
