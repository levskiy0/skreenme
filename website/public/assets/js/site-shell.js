(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const button = header.querySelector('.island-menu-button');
  const navigation = header.querySelector('#site-primary-navigation');
  const languageSwitcher = header.querySelector('.language-switcher');
  const narrowScreen = window.matchMedia('(max-width: 760px)');
  let frame = 0;

  function closeMenu(restoreFocus = false) {
    if (!header.classList.contains('is-menu-open')) return;
    header.classList.remove('is-menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', button.dataset.openLabel || 'Open navigation');
    if (restoreFocus) button.focus();
  }

  function closeLanguage(restoreFocus = false) {
    if (!languageSwitcher?.open) return;
    languageSwitcher.open = false;
    header.classList.remove('is-language-open');
    if (restoreFocus) languageSwitcher.querySelector('summary')?.focus();
  }

  function syncIsland() {
    frame = 0;
    const condensed = narrowScreen.matches || window.scrollY > 180;
    header.classList.toggle('is-condensed', condensed);
    header.classList.toggle('is-language-open', Boolean(languageSwitcher?.open && condensed));
    if (!condensed) {
      closeMenu();
      closeLanguage();
    }
  }

  function queueSync() {
    if (!frame) frame = window.requestAnimationFrame(syncIsland);
  }

  header.classList.add('shell-js');
  syncIsland();

  button.addEventListener('click', () => {
    const opening = !header.classList.contains('is-menu-open');
    if (opening) closeLanguage();
    header.classList.toggle('is-menu-open', opening);
    button.setAttribute('aria-expanded', String(opening));
    button.setAttribute('aria-label', opening ? (button.dataset.closeLabel || 'Close navigation') : (button.dataset.openLabel || 'Open navigation'));
    if (opening) navigation.querySelector('a')?.focus();
  });

  languageSwitcher?.addEventListener('toggle', () => {
    header.classList.toggle('is-language-open', languageSwitcher.open && header.classList.contains('is-condensed'));
    if (languageSwitcher.open) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (languageSwitcher?.open) closeLanguage(true);
    else closeMenu(true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!header.contains(event.target)) closeMenu();
    if (!languageSwitcher?.contains(event.target)) closeLanguage();
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  window.addEventListener('scroll', queueSync, { passive: true });
  window.addEventListener('resize', queueSync, { passive: true });
  narrowScreen.addEventListener('change', queueSync);
})();
