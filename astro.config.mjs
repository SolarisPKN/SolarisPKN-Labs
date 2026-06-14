import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://solarispkn.github.io',
  base: '/',
  output: 'static',
  build: {
    assets: 'assets'
  }
});