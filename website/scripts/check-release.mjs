import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'https://skreenme.com';
const languages = ['en', 'es', 'de', 'fr', 'pt-BR', 'ru'];
const localePaths = { en: '', es: '/es', de: '/de', fr: '/fr', 'pt-BR': '/pt', ru: '/ru' };
const errors = [];

function alternatesFor(url) {
  const pathname = new URL(url).pathname;
  const englishPath = pathname.replace(/^\/(es|de|fr|pt|ru)(?=\/)/, '');
  return Object.fromEntries(languages.map((language) => [language, `${origin}${localePaths[language]}${englishPath}`]));
}

async function filesUnder(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    result.push(...(entry.isDirectory() ? await filesUnder(path) : [path]));
  }
  return result;
}

function pagePath(file) {
  const path = relative(dist, file).split(sep).join('/');
  return path === 'index.html' ? '/' : `/${path.replace(/index\.html$/, '')}`;
}

const htmlFiles = (await filesUnder(dist)).filter((file) => file.endsWith('.html') && !file.endsWith('/404.html'));
const htmlByUrl = new Map();
for (const file of htmlFiles) {
  htmlByUrl.set(`${origin}${pagePath(file)}`, await readFile(file, 'utf8'));
}

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Map();
for (const block of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!loc) errors.push('Sitemap entry without a location');
  else if (sitemapUrls.has(loc)) errors.push(`Duplicate sitemap URL: ${loc}`);
  else sitemapUrls.set(loc, block[1]);
}

for (const [url, html] of htmlByUrl) {
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  if (noindex) {
    if (sitemapUrls.has(url)) errors.push(`Noindex page in sitemap: ${url}`);
    continue;
  }
  if (!sitemapUrls.has(url)) errors.push(`Indexable page missing from sitemap: ${url}`);
  if (!html.includes(`<link rel="canonical" href="${url}"`)) errors.push(`Wrong canonical: ${url}`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`Missing title: ${url}`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`Missing description: ${url}`);
  if (!/<h1\b[^>]*>/.test(html)) errors.push(`Missing H1: ${url}`);
  const expectedAlternates = alternatesFor(url);
  for (const language of [...languages, 'x-default']) {
    const alternateUrl = language === 'x-default' ? expectedAlternates.en : expectedAlternates[language];
    if (!html.includes(`hreflang="${language}" href="${alternateUrl}"`)) errors.push(`Wrong ${language} hreflang: ${url}`);
  }
}

for (const [url, block] of sitemapUrls) {
  if (!htmlByUrl.has(url)) errors.push(`Sitemap URL has no built page: ${url}`);
  const links = [...block.matchAll(/<xhtml:link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)];
  if (links.length !== languages.length) errors.push(`Wrong sitemap alternate count: ${url} (${links.length})`);
  const expectedAlternates = alternatesFor(url);
  for (const [, language, alternateUrl] of links) {
    if (!languages.includes(language)) errors.push(`Unexpected sitemap language ${language}: ${url}`);
    else if (alternateUrl !== expectedAlternates[language]) errors.push(`Wrong sitemap alternate ${language}: ${url}`);
  }
}

for (const [url, html] of htmlByUrl) {
  for (const [, href] of html.matchAll(/\bhref="(\/[^"]*)"/g)) {
    if (href.startsWith('//') || href.startsWith('/assets/') || href.startsWith('/favicon.ico')) continue;
    const target = new URL(href, origin);
    if (!target.pathname.endsWith('/')) errors.push(`Noncanonical internal link ${href} on ${url}`);
    const canonicalPath = target.pathname.endsWith('/') ? target.pathname : `${target.pathname}/`;
    if (!htmlByUrl.has(`${origin}${canonicalPath}`)) errors.push(`Broken internal link ${href} on ${url}`);
  }
}

const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt points to the wrong sitemap');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Release SEO checks passed: ${sitemapUrls.size} indexable pages, ${htmlByUrl.size} built pages, six languages.`);
}
