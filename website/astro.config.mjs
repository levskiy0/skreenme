import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://skreen.me',
  output: 'static',
  integrations: [sitemap({
    filter: (page) => page !== 'https://skreen.me/download/',
  })],
  build: {
    format: 'directory',
  },
});
