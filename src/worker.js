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