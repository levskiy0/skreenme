import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://skreenme.com',
  output: 'static',
  integrations: [sitemap({
    filter: (page) => !['https://skreenme.com/download/', 'https://skreenme.com/releases/'].includes(page),
  })],
  build: {
    format: 'directory',
  },
});
