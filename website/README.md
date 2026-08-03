# Skreen website

Static Astro website for [skreenme.com](https://skreenme.com), deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

GitHub Pages deployment is configured in the repository-level workflow at
`.github/workflows/deploy-website.yml`. In the GitHub repository settings, set
**Pages → Build and deployment → Source** to **GitHub Actions**.
