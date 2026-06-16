import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://solarispkn.pages.dev',
  base: '/',
  output: 'static',
  build: {
    assets: 'assets'
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});