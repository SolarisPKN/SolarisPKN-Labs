// functions/_middleware.js
export const onRequest = ({ request, next }) => {
  const url = new URL(request.url);

  // Si el host es pages.dev, redirigir 301 al nuevo dominio
  if (url.hostname === 'solarispkn.pages.dev') {
    url.hostname = 'labs.solarispkn.com.ar';
    return Response.redirect(url.toString(), 301);
  }

  // Si ya es el dominio correcto, continuar
  return next();
};