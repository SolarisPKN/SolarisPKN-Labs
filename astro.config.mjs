import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Preserve Astro 4's HTML-aware whitespace behavior and visual spacing.
  compressHTML: true,
  site: 'https://labs.solarispkn.com.ar',
  base: '/',
  output: 'static',
  build: {
    assets: 'assets',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    domains: ['labs.solarispkn.com.ar'],
  },
  integrations: [
    sitemap({
      filter: (page) => {
        // Excluir páginas que no tienen idioma o que no queremos indexar
        return !page.includes('/404') &&
               !page.includes('/under-construction');
        // ✅ Eliminamos la exclusión de '/' para que aparezca en el sitemap
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@assets': '/src/assets',
        '@scripts': '/src/scripts',
        '@styles': '/src/styles',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@locales': '/src/locales',
      },
    },
  },
});