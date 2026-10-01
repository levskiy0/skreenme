import english from './data/pages.json';
import es from './data/locales/es.json';
import de from './data/locales/de.json';
import fr from './data/locales/fr.json';
import pt from './data/locales/pt.json';
import ru from './data/locales/ru.json';

export const locales = ['en', 'es', 'de', 'fr', 'pt', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const translatedLocales = locales.filter((locale) => locale !== 'en') as Exclude<Locale, 'en'>[];

export const languageTags: Record<Locale, string> = {
  en: 'en', es: 'es', de: 'de', fr: 'fr', pt: 'pt-BR', ru: 'ru',
};

export const languageNames: Record<Locale, string> = {
  en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', pt: 'Português', ru: 'Русский',
};

const translations = { es, de, fr, pt, ru };

const englishUi = {
  skip: 'Skip to content', homeLabel: 'Skreen home', mainNavigation: 'Main navigation',
  features: 'Features', macGuide: 'Mac guide', faq: 'FAQ', releases: 'Releases',
  download: 'Download', downloadForMac: 'Download for Mac', openNavigation: 'Open navigation', closeNavigation: 'Close navigation',
  footerTagline: 'Capture a page, mark up the useful part, and cover private details before you share.',
  haveIdea: 'Have an idea? Tell us ↗', product: 'Product', explore: 'Explore', elsewhere: 'Elsewhere', feedback: 'Feedback',
  madeForMac: 'Made for macOS.', backToTop: 'Back to top', footerNavigation: 'Footer navigation',
  heroEyebrow: 'A screenshot app made for Mac', seeHow: 'See how it works',
  editorImageAlt: 'Skreen screenshot editor showing a cloud image', socialImageAlt: 'Skreen for Mac',
  proofLabel: 'What you can do', proof: [
    { title: 'A whole page, one image.', body: 'Keep scrolling. You decide where the capture stops.' },
    { title: 'Point to what matters.', body: 'Add an arrow, a note, or a frame before you send it.' },
    { title: 'Cover private details.', body: 'Review local detection and hide sensitive parts before export.' },
  ],
  editor: 'The editor', editorTitle: 'A screenshot is easier', editorAccent: 'to understand with context.',
  editorLead: 'Crop away the noise, add a note, or hide a detail before you send it.', exploreFeature: 'Explore',
  workflow: 'How it works', workflowTitle: 'Take the screenshot.', workflowAccent: 'Make it clear.',
  workflowLead: 'Start with Shift + ⌘ + 0 for an area. Add your edits in Skreen, then export.',
  moreFeatures: 'More Skreen features', moreToExplore: 'Also in Skreen',
  textQr: 'Text and QR recognition', combineScreenshots: 'Combine screenshots', allFeatures: 'All features',
  goodToKnow: 'FAQ', faqTitle: 'Questions about', faqAccent: 'Skreen.', ready: 'For your next screenshot',
  finalTitle: 'Capture what you need.', finalAccent: 'Share only what you want.', finalLead: 'Take a screenshot, mark it up, and cover private details before sharing.',
  readGuide: 'Read the guide', finishImage: 'Edit this screenshot in Skreen.', scrollingPage: 'Capture a scrolling page',
  annotateScreenshot: 'Annotate your screenshot', hidePrivate: 'Hide private details', exploreFeatures: 'Explore Skreen features',
  learnMore: 'Learn more', updated: 'Updated', forMac: 'Skreen for macOS 14+',
  finishIt: 'Try it in Skreen.', articleDownloadLead: 'Skreen {version} runs on macOS 14 or later.',
  downloadSkreen: 'Download Skreen for Mac', keepExploring: 'Related guides',
  ctaTitle: 'Need a clearer screenshot?', ctaLead: 'Capture it in Skreen, then add notes or hide details before you send it.',
  backToSkreen: 'Back to Skreen', releasesTitle: 'Skreen releases.', latestRelease: 'Latest release',
  version: 'Version', olderBuild: 'Need an older build or want to report a problem?', allGithub: 'All GitHub releases', sendFeedback: 'Send feedback',
};

export function getUi(locale: Locale): typeof englishUi {
  return locale === 'en' ? englishUi : translations[locale].ui;
}

export function withLocale(locale: Locale, path: string): string {
  if (/^(?:https?:|mailto:|#)/.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return canonicalInternalPath(locale === 'en' ? normalized : `/${locale}${normalized}`);
}

export function canonicalInternalPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const match = path.match(/^([^?#]*)(.*)$/);
  if (!match) return path;
  const [, pathname, suffix] = match;
  return `${pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(pathname) ? pathname : `${pathname}/`}${suffix}`;
}

export function normalizeHtmlLinks(html: string): string {
  return html.replace(/href="(\/[^"]*)"/g, (_, path: string) => `href="${canonicalInternalPath(path)}"`);
}

export function englishPath(path: string): string {
  return path.replace(/^\/(es|de|fr|pt|ru)(?=\/|$)/, '') || '/';
}

export function localizeHtml(locale: Locale, html: string): string {
  if (locale === 'en') return normalizeHtmlLinks(html);
  return html.replace(/href="(\/(?!\/)[^"]*)"/g, (_, path: string) => `href="${withLocale(locale, path)}"`);
}

export function getPages(locale: Locale) {
  if (locale === 'en') return english;
  const t = translations[locale];
  const articles = Object.fromEntries(Object.entries(english.articles).map(([id, article]) => {
    const translated = t.articles[id as keyof typeof t.articles];
    return [id, {
      ...article,
      ...translated,
      updatedIso: '2026-10-01',
      bodyHtml: localizeHtml(locale, translated.bodyHtml),
      related: article.related.map((item, index) => ({ ...item, ...translated.related[index], url: withLocale(locale, item.url) })),
      parent_url: withLocale(locale, 'parent_url' in article ? article.parent_url : '/features'),
    }];
  }));
  const combineIndex = (key: 'features' | 'guides') => ({
    ...english[key], ...t[key],
    items: english[key].items.map((item, index) => ({ ...item, ...t[key].items[index], url: withLocale(locale, item.url) })),
  });
  return {
    home: {
      ...english.home, ...t.home,
      features: english.home.features.map((item, index) => ({ ...item, ...t.home.features[index], url: withLocale(locale, item.url) })),
    },
    features: combineIndex('features'),
    guides: combineIndex('guides'),
    changelog: {
      ...english.changelog, ...t.changelog,
      releases: english.changelog.releases.map((release, index) => ({ ...release, ...t.changelog.releases[index] })),
    },
    articles,
  };
}

export function formatDate(iso: string, locale: Locale): string {
  const date = new Intl.DateTimeFormat(languageTags[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  return locale === 'fr' ? date.replace(/^1 /, '1er ') : date;
}
