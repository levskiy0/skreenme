import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://skreenme.com',
  output: 'static',
  integrations: [sitemap({
    filter: (page) => page !== 'https://skreenme.com/download/',
  })],
  build: {
    format: 'directory',
  },
});
