// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  // 1. Rutas estáticas (páginas fijas)
  const staticPages = [
    '',
    '/es/',
    '/en/',
    '/es/portfolio',
    '/en/portfolio',
    '/es/arquitectura',
    '/en/arquitectura',
    '/es/blog',
    '/en/blog',
    '/es/under-construction',
    '/en/under-construction',
  ];

  // 2. Rutas dinámicas (posts del blog)
  let blogPosts: string[] = [];
  try {
    const posts = await getCollection('blog');
    blogPosts = posts.map(post => `/es/blog/${post.slug}`);
    // Si tienes versión en inglés, puedes duplicar con /en/blog/
    // pero en tu estructura actual, los posts no tienen versión en inglés independiente,
    // así que solo incluimos /es/blog/...
  } catch (e) {
    console.warn('No se pudo obtener la colección de blog para el sitemap:', e);
  }

  // 3. Unir todas las rutas
  const allPages = [...staticPages, ...blogPosts];

  // 4. Generar el XML del sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>${site}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.includes('/blog/') ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' || page === '/es/' || page === '/en/' ? '1.0' : '0.8'}</priority>
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