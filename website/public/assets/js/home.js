(() => {
  const answers = Array.from(document.querySelectorAll('.faq-list details'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const expanded = new WeakMap(answers.map((answer) => [answer, answer.open]));

  function setExpanded(answer, opening) {
    if (expanded.get(answer) === opening) return;
    expanded.set(answer, opening);

    const startHeight = answer.getBoundingClientRect().height;
    answer.getAnimations().forEach((animation) => animation.cancel());

    if (reducedMotion.matches) {
      answer.open = opening;
      answer.style.removeProperty('height');
      answer.style.removeProperty('overflow');
      return;
    }

    answer.style.height = `${startHeight}px`;
    answer.style.overflow = 'hidden';
    if (opening) answer.open = true;

    const endHeight = opening ? answer.scrollHeight : answer.querySelector('summary').offsetHeight;
    const animation = answer.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' },
    );

    animation.onfinish = () => {
      if (!opening) answer.open = false;
      answer.style.removeProperty('height');
      answer.style.removeProperty('overflow');
    };
  }

  answers.forEach((answer) => {
    answer.querySelector('summary').addEventListener('click', (event) => {
      event.preventDefault();
      const opening = !expanded.get(answer);
      if (opening) answers.forEach((other) => { if (other !== answer) setExpanded(other, false); });
      setExpanded(answer, opening);
    });
  });

  const heroEditor = document.querySelector('.hero-editor');
  const heroDevice = document.querySelector('.hero-device');
  if (heroEditor && heroDevice) {
    const emptyImage = heroEditor.querySelector('.hero-editor-empty');
    const captureImage = heroEditor.querySelector('.hero-editor-capture');
    const setEditorView = (view) => {
      heroEditor.dataset.editorView = view;
      emptyImage.setAttribute('aria-hidden', String(view !== 'empty'));
      captureImage.setAttribute('aria-hidden', String(view !== 'capture'));
    };

    if (!reducedMotion.matches) {
      const sticky = heroDevice.querySelector('.hero-story-sticky');
      const stage = heroDevice.querySelector('.hero-story-stage');
      const keys = Array.from(heroDevice.querySelectorAll('[data-story-key]'));
      const clamp = (value) => Math.max(0, Math.min(1, value));
      const ramp = (value, start, end) => clamp((value - start) / (end - start));
      const keyReveals = [[0, .035], [.045, .08], [.09, .125]];
      const keyPresses = [.18, .25, .32];
      let keyWidths = [0, 0, 0];
      let frame = 0;
      let currentView = '';

      const updateStory = () => {
        frame = 0;
        const bounds = heroDevice.getBoundingClientRect();
        const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
        const scrollable = Math.max(1, bounds.height - sticky.offsetHeight);
        const rawProgress = clamp((stickyTop - bounds.top) / scrollable);
        const sequenceEnd = window.matchMedia('(max-width: 620px)').matches ? .57 : .55;
        const progress = clamp(rawProgress / sequenceEnd);
        const move = clamp(window.scrollY / Math.max(1, bounds.top + window.scrollY - stickyTop));
        const introOpacity = 1 - clamp((move - .30) / .60);
        const introOffset = move * Math.min(window.innerHeight * 1.3, 1200);
        const selectionProgress = ramp(progress, .51, .70);
        const selectionOpacity = ramp(progress, .50, .53) * (1 - ramp(progress, .75, .80));
        const productOpacity = ramp(progress, .40, .47) * (1 - ramp(progress, .77, .84));
        const editorProgress = ramp(progress, .77, .85);
        const captureProgress = ramp(progress, .88, .95);

        keys.forEach((key, index) => {
          const visible = ramp(progress, ...keyReveals[index]);
          const press = clamp(1 - Math.abs(progress - keyPresses[index]) / .033);
          const gap = index === 0 ? 0 : 12 * visible;
          key.style.setProperty('--key-visible', visible.toFixed(3));
          key.style.setProperty('--key-space', `${(keyWidths[index] * visible + gap).toFixed(1)}px`);
          key.style.setProperty('--key-gap', `${gap.toFixed(1)}px`);
          key.style.setProperty('--key-y', `${(6 * (1 - visible) + 2 * press).toFixed(1)}px`);
          key.style.setProperty('--key-scale', (1 - .018 * press).toFixed(3));
          key.classList.toggle('is-pressed', press > .12);
        });

        heroDevice.style.setProperty('--keys-opacity', (1 - ramp(progress, .36, .41)).toFixed(3));
        heroDevice.style.setProperty('--hint-opacity', ramp(progress, .12, .18).toFixed(3));
        heroDevice.style.setProperty('--intro-opacity', introOpacity.toFixed(3));
        heroDevice.style.setProperty('--intro-offset', `${introOffset.toFixed(1)}px`);
        heroDevice.style.setProperty('--selection-progress', selectionProgress.toFixed(3));
        heroDevice.style.setProperty('--selection-opacity', selectionOpacity.toFixed(3));
        heroDevice.style.setProperty('--product-opacity', productOpacity.toFixed(3));
        heroDevice.style.setProperty('--editor-progress', editorProgress.toFixed(3));
        heroDevice.style.setProperty('--capture-progress', captureProgress.toFixed(3));
        const view = progress < .77 ? 'none' : progress < .88 ? 'empty' : 'capture';
        if (view !== currentView) {
          currentView = view;
          setEditorView(view);
        }
      };
      const queueStoryUpdate = () => {
        if (!frame) frame = requestAnimationFrame(updateStory);
      };
      const centerStory = () => {
        const top = Math.max(0, (window.innerHeight - sticky.offsetHeight) / 2);
        heroDevice.style.setProperty('--story-center-top', `${top.toFixed(1)}px`);
        const stageBounds = stage.getBoundingClientRect();
        const productScale = Math.min(1.16, stageBounds.width * .84 / 620, stageBounds.height * .79 / 360);
        heroDevice.style.setProperty('--product-scale', productScale.toFixed(3));
        heroDevice.style.setProperty('--selection-outset', `${(20 / productScale).toFixed(2)}px`);
        heroDevice.style.setProperty('--selection-padding', `${(40 / productScale).toFixed(2)}px`);
        keyWidths = keys.map((key) => key.querySelector('kbd').offsetWidth);
      };
      const resizeStory = () => {
        centerStory();
        queueStoryUpdate();
      };

      heroDevice.classList.add('is-story-ready');
      heroDevice.closest('.hero').classList.add('is-story-ready');
      centerStory();
      updateStory();
      window.addEventListener('scroll', queueStoryUpdate, { passive: true });
      window.addEventListener('resize', resizeStory);
      window.visualViewport?.addEventListener('resize', resizeStory);
      window.addEventListener('load', resizeStory, { once: true });
    }
  }

  const closingScene = document.querySelector('.download-close');
  if (closingScene && !reducedMotion.matches) {
    let frame = 0;
    const updateScene = () => {
      frame = 0;
      const top = closingScene.getBoundingClientRect().top;
      const reveal = Math.max(0, Math.min(1, (window.innerHeight - top) / (window.innerHeight * 0.85)));
      closingScene.style.setProperty('--landscape-reveal', reveal.toFixed(3));
    };
    const queueSceneUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateScene);
    };
    updateScene();
    window.addEventListener('scroll', queueSceneUpdate, { passive: true });
    window.addEventListener('resize', queueSceneUpdate);
  }
})();
