export function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Permitir archivos estáticos (no redirigir)
  if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|pdf)$/i.test(path)) {
    return context.next();
  }

  // 2. Si ya tiene /es/ o /en/, dejarlo pasar
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && (segments[0] === 'es' || segments[0] === 'en')) {
    return context.next();
  }

  // 3. Detecta idioma preferido
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferEn = acceptLanguage.startsWith('en');
  const targetLang = preferEn ? 'en' : 'es';

  // 4. Construye la nueva URL (manteniendo el resto de la ruta)
  const newPath = `/${targetLang}${path}`;
  return Response.redirect(new URL(newPath, url), 302);
}