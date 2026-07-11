// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  // Obtener la URL base sin barra al final
  const baseUrl = site?.toString().replace(/\/$/, '') || 'https://solarispkn.pages.dev';

  // Definir rutas estáticas
  const pages = [
    '', // raíz
    '/es/',
    '/en/',
    '/es/portfolio',
    '/en/portfolio',
    '/es/arquitectura',
    '/en/arquitectura',
    '/es/blog',
    '/en/blog',
  ];

  // Si tienes posts de blog, deberías agregarlos aquí.
  // Por ahora, asumimos que los posts se generan dinámicamente.
  // Puedes leer los slugs de los posts desde `src/content/blog/` si usas Content Collections.

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .filter(page => !page.includes('under-construction')) // Filtrar under-construction
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page === '' ? 'monthly' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};