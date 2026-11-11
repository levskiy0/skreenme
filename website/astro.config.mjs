import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://skreenme.com',
  output: 'static',
  integrations: [sitemap({
    filter: (page) => !['https://skreenme.com/download/', 'https://skreenme.com/releases/', 'https://skreenme.com/app/', 'https://skreenme.com/pt/app/'].includes(page),
    i18n: {
      defaultLocale: 'en',
      locales: { en: 'en', es: 'es', de: 'de', fr: 'fr', pt: 'pt-BR', ru: 'ru' },
    },
  })],
  build: {
    format: 'directory',
  },
});
