import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://skreenme.com',
  output: 'static',
  integrations: [sitemap({
    filter: (page) => !['https://skreenme.com/download/', 'https://skreenme.com/releases/'].includes(page),
    i18n: {
      defaultLocale: 'en',
      locales: { en: 'en', es: 'es', de: 'de', fr: 'fr', pt: 'pt-BR', ru: 'ru' },
    },
  })],
  build: {
    format: 'directory',
  },
});
