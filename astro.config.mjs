import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // ===== CONFIGURACIÓN GENERAL =====
  site: 'https://solarispkn.pages.dev',
  base: '/',
  output: 'static',

  // ===== BUILD =====
  build: {
    assets: 'assets',
  },

  // ===== IMÁGENES (Optimización con Sharp) =====
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    domains: ['solarispkn.pages.dev'],
  },

  // ===== INTERNACIONALIZACIÓN (i18n) =====
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },

  // ===== INTEGRACIONES =====
  integrations: [
    react(),
    sitemap({
      filter: (page) => {},
    }),
  ],

  // ===== ALIAS PARA IMPORTS (Vite) =====
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