// functions/_middleware.js
export const onRequest = ({ request, next }) => {
  const url = new URL(request.url);

  // Solo redirigir si el hostname es el dominio antiguo de Pages
  if (url.hostname === 'solarispkn.pages.dev') {
    // Construir la nueva URL con el mismo path y query string
    const newUrl = new URL(url.pathname + url.search, 'https://labs.solarispkn.com.ar');

    // Redirigir con 301 (movido permanentemente)
    return Response.redirect(newUrl.toString(), 301);
  }

  // Si no es pages.dev, servir el contenido normalmente
  return next();
};