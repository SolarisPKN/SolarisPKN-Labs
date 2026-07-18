import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
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
    domains: ['solarispkn.pages.dev'],
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        // Excluir páginas que no tienen idioma o que no queremos indexar
        return !page.includes('/404') &&
               !page.includes('/under-construction') &&
               page !== '/'; // 🔥 Excluir la raíz
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