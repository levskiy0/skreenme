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
  const editorSwitch = document.querySelector('.hero-editor-switch');
  if (heroEditor && editorSwitch) {
    const captureImage = heroEditor.querySelector('.hero-editor-capture');
    const styledImage = heroEditor.querySelector('.hero-editor-styled');
    const buttons = Array.from(editorSwitch.querySelectorAll('[data-editor-view-button]'));
    editorSwitch.classList.add('is-ready');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.editorViewButton;
        heroEditor.dataset.editorView = view;
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        captureImage.setAttribute('aria-hidden', String(view !== 'capture'));
        styledImage.setAttribute('aria-hidden', String(view !== 'styled'));
      });
    });
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
