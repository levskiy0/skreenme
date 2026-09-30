(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const button = header.querySelector('.island-menu-button');
  const navigation = header.querySelector('#site-primary-navigation');
  const narrowScreen = window.matchMedia('(max-width: 760px)');
  let frame = 0;

  function closeMenu(restoreFocus = false) {
    if (!header.classList.contains('is-menu-open')) return;
    header.classList.remove('is-menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus) button.focus();
  }

  function syncIsland() {
    frame = 0;
    const condensed = narrowScreen.matches || window.scrollY > 180;
    header.classList.toggle('is-condensed', condensed);
    header.classList.toggle('is-minimal', window.scrollY > 900);
    if (!condensed) closeMenu();
  }

  function queueSync() {
    if (!frame) frame = window.requestAnimationFrame(syncIsland);
  }

  header.classList.add('shell-js');
  syncIsland();

  button.addEventListener('click', () => {
    const opening = !header.classList.contains('is-menu-open');
    header.classList.toggle('is-menu-open', opening);
    button.setAttribute('aria-expanded', String(opening));
    button.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    if (opening) navigation.querySelector('a')?.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu(true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  window.addEventListener('scroll', queueSync, { passive: true });
  window.addEventListener('resize', queueSync, { passive: true });
  narrowScreen.addEventListener('change', queueSync);
})();
