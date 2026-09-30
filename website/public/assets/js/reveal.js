(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll([
    '.hero-copy', '.hero-device', '.proof-item', '.showcase-heading',
    '.showcase-feature', '.workflow-heading', '.workflow-step', '.more-features',
    '.faq-heading', '.faq-list', '.index-hero-inner', '.index-feature',
    '.index-guide', '.index-extra', '.article-hero-copy', '.article-hero-icon',
    '.article-figure', '.article-content > h2', '.article-content > h3',
    '.article-content > p', '.article-content > ul', '.article-content > ol',
    '.article-aside', '.related-section', '.releases-heading',
    '.releases-current', '.release-entry', '.page-cta-inner',
    '.footer-intro', '.footer-column', '.footer-bottom', '.footer-wordmark',
  ].join(', '));

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('reveal-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  for (const target of targets) {
    const bounds = target.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top < window.innerHeight * 0.85) continue;
    const siblings = Array.from(target.parentElement.children).filter((item) => item.matches(target.tagName.toLowerCase()));
    const position = siblings.indexOf(target);
    target.style.setProperty('--reveal-delay', `${Math.min(position, 2) * 80}ms`);
    target.classList.add('reveal-pending');
    observer.observe(target);
  }

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    for (const target of targets) {
      target.classList.remove('reveal-pending');
      observer.unobserve(target);
    }
  });
})();
