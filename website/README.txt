Skreen website
==============

Static Astro site for https://skreenme.com, deployed through GitHub Pages.
The site is built to HTML at build time. It does not use SSR or Grav.

Local development
-----------------

    cd website
    npm ci
    npm run dev -- --host 127.0.0.1

Open the URL printed by Astro (normally http://127.0.0.1:4321/).

Content and releases
--------------------

Page data and article HTML live in src/data/pages.json. Layouts and routes live
in src/components, src/layouts, and src/pages. Images and styles are in
public/assets.

English pages use /. Spanish, German, French, Brazilian Portuguese, and Russian
use /es/, /de/, /fr/, /pt/, and /ru/. Keep every page available in all six
languages so the language switcher and hreflang links remain reciprocal.
Translations live in src/data/locales/. If a page is added or removed, update
all five translation files and the release checks together.

Exception: an article or link marked "en_only": true in pages.json exists only
in English. It gets no hreflang set and no sitemap alternates, is left out of
the translated guide lists, and the language switcher sends other languages to
their /guides/ page. Append English-only related links and guide items after
the translated ones so the index-based translation mapping stays aligned.

Retired URLs that still get search clicks (/app/, /pt/app/) are noindex pages
with an instant meta refresh to the home page; GitHub Pages cannot send 301.

Download buttons link to skreenme.dmg in the latest GitHub Release. The stable
URL is in src/site.ts; the same URL is recorded in page data. Keep version text
and release notes current when publishing a new release. Upload the asset as
skreenme.dmg so the latest-release link continues to work.

Build and deployment
--------------------

    npm run build
    npm run preview

The build generates a single sitemap.xml with locale alternates, then verifies
indexable URLs, canonical and hreflang links, internal links, and robots.txt.
Download and legacy release pages stay out of the sitemap and carry noindex.

The repository workflow .github/workflows/deploy-website.yml deploys the
website build when main changes. In GitHub repository settings, Pages must use
GitHub Actions as its source.
