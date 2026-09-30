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

  const hero = document.querySelector('.hero');
  const scrollCue = hero?.querySelector('.hero-scroll-cue');
  if (scrollCue) {
    let cueFrame = 0;
    const updateScrollCue = () => {
      cueFrame = 0;
      const bounds = hero.getBoundingClientRect();
      scrollCue.classList.toggle('is-visible', bounds.top < window.innerHeight * .7 && bounds.bottom > window.innerHeight - 32);
    };
    const queueScrollCueUpdate = () => {
      if (!cueFrame) cueFrame = requestAnimationFrame(updateScrollCue);
    };
    updateScrollCue();
    window.addEventListener('scroll', queueScrollCueUpdate, { passive: true });
    window.addEventListener('resize', queueScrollCueUpdate);
  }

  const particleLayers = Array.from(document.querySelectorAll('.hero-story-particles, .faq-particles'));
  if (particleLayers.length) {
    const particles = particleLayers.map((layer) => ({
      layer,
      items: Array.from(layer.querySelectorAll('.ambient-particle')).map((element, index) => ({
        element,
        phase: index * 2.39996,
        speed: .35 + (index % 5) * .055,
        xRange: 9 + (index % 4) * 2.5,
        yRange: 11 + (index % 5) * 2.5,
        baseRotation: element.classList.contains('ambient-particle--diamond') ? 45 : 0,
      })),
    }));
    const visibleLayers = new Set();
    let ambientFrame = 0;
    let previousAmbientTime = 0;
    let ambientTime = 0;

    const animateParticles = (timestamp) => {
      ambientFrame = 0;
      if (document.hidden || reducedMotion.matches || !visibleLayers.size) {
        previousAmbientTime = 0;
        return;
      }
      if (previousAmbientTime) ambientTime += Math.min(timestamp - previousAmbientTime, 50) / 1000;
      previousAmbientTime = timestamp;

      particles.forEach(({ layer, items }) => {
        if (!visibleLayers.has(layer)) return;
        items.forEach(({ element, phase, speed, xRange, yRange, baseRotation }) => {
          const x = xRange * (Math.sin(ambientTime * speed + phase) - Math.sin(phase));
          const y = yRange * (Math.cos(ambientTime * speed + phase) - Math.cos(phase));
          const rotation = baseRotation + 9 * (Math.sin(ambientTime * speed * .7 + phase) - Math.sin(phase));
          const opacity = .65 + .08 * (Math.sin(ambientTime * speed * .9 + phase) - Math.sin(phase));
          element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rotation.toFixed(1)}deg)`;
          element.style.opacity = opacity.toFixed(2);
        });
      });
      ambientFrame = requestAnimationFrame(animateParticles);
    };

    const syncParticles = () => {
      if (document.hidden || reducedMotion.matches || !visibleLayers.size) {
        if (ambientFrame) cancelAnimationFrame(ambientFrame);
        ambientFrame = 0;
        previousAmbientTime = 0;
        if (reducedMotion.matches) particles.forEach(({ items }) => items.forEach(({ element }) => {
          element.style.removeProperty('transform');
          element.style.removeProperty('opacity');
        }));
      } else if (!ambientFrame) {
        ambientFrame = requestAnimationFrame(animateParticles);
      }
    };

    const particleObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) visibleLayers.add(target);
        else visibleLayers.delete(target);
      });
      syncParticles();
    }, { rootMargin: '80px 0px' });
    particleLayers.forEach((layer) => particleObserver.observe(layer));
    document.addEventListener('visibilitychange', syncParticles);
    reducedMotion.addEventListener('change', syncParticles);
  }

  const heroEditor = document.querySelector('.hero-editor');
  const heroDevice = document.querySelector('.hero-device');
  if (heroEditor && heroDevice && !reducedMotion.matches) {
    const sticky = heroDevice.querySelector('.hero-story-sticky');
    const stage = heroDevice.querySelector('.hero-story-stage');
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const ramp = (value, start, end) => clamp((value - start) / (end - start));
    const smooth = (value) => value * value * (3 - 2 * value);
    const approach = (current, target, distance) => current + Math.sign(target - current) * Math.min(Math.abs(target - current), distance);
    // Bounds of the product card inside the white screenshot frame (2414 × 1650).
    const capturedCard = { left: 548, top: 444, width: 1300, height: 752 };
    let frame = 0;
    let displayedProgress = null;
    let displayedIntroMove = null;
    let previousFrameTime = 0;

    const updateStory = (timestamp = performance.now()) => {
      frame = 0;
      const bounds = heroDevice.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
      const scrollable = Math.max(1, bounds.height - sticky.offsetHeight);
      const lead = Math.min(window.innerHeight * .42, 420);
      const targetProgress = clamp((stickyTop - bounds.top + lead) / (scrollable + lead));
      const pinStart = window.scrollY + bounds.top - stickyTop;
      const targetIntroMove = clamp(window.scrollY / Math.max(1, pinStart));
      const elapsed = Math.min(24, Math.max(0, timestamp - previousFrameTime));
      if (displayedProgress === null || document.hidden) {
        displayedProgress = targetProgress;
        displayedIntroMove = targetIntroMove;
      } else {
        const follow = 1 - Math.exp(-elapsed / 150);
        displayedProgress += (targetProgress - displayedProgress) * follow;
        if (Math.abs(targetProgress - displayedProgress) < .0005) displayedProgress = targetProgress;
        displayedIntroMove = approach(displayedIntroMove, targetIntroMove, 1.25 * elapsed / 1000);
      }
      previousFrameTime = timestamp;
      const progress = displayedProgress;
      const move = displayedIntroMove;
      const introBase = Math.max(0, Math.min(window.scrollY, pinStart));
      const introExit = Math.min(window.innerHeight * 1.3, 1200);
      const introOffset = introBase + move * introExit;
      const introOpacity = 1 - smooth(ramp(move, .72, 1));
      const productEnter = (1 - smooth(ramp(move, .02, .34))) * Math.min(window.innerHeight * .9, 850);
      const selectionProgress = smooth(ramp(progress, .27, .49));
      const captureFlash = smooth(ramp(progress, .59, .66)) * (1 - smooth(ramp(progress, .66, .72)));
      const selectionOpacity = smooth(ramp(progress, .26, .29)) * (1 - smooth(ramp(progress, .55, .60)));
      const productOpacity = smooth(ramp(move, .07, .30)) * (1 - smooth(ramp(progress, .62, .71)));
      const editorPop = smooth(ramp(progress, .62, .75));
      const resultOpacity = smooth(ramp(progress, .80, .99));

      heroDevice.style.setProperty('--capture-flash-opacity', captureFlash.toFixed(3));
      heroDevice.style.setProperty('--intro-opacity', introOpacity.toFixed(3));
      heroDevice.style.setProperty('--intro-offset', `${introOffset.toFixed(1)}px`);
      heroDevice.style.setProperty('--selection-progress', selectionProgress.toFixed(3));
      heroDevice.style.setProperty('--selection-opacity', selectionOpacity.toFixed(3));
      heroDevice.style.setProperty('--product-opacity', productOpacity.toFixed(3));
      heroDevice.style.setProperty('--product-enter-y', `${productEnter.toFixed(1)}px`);
      heroDevice.style.setProperty('--editor-opacity', editorPop.toFixed(3));
      heroDevice.style.setProperty('--editor-rise', `${(48 * (1 - editorPop)).toFixed(1)}px`);
      heroDevice.style.setProperty('--editor-scale', (.94 + .06 * editorPop).toFixed(3));
      heroDevice.style.setProperty('--result-opacity', resultOpacity.toFixed(3));
      if (!document.hidden && (displayedProgress !== targetProgress || displayedIntroMove !== targetIntroMove)) queueStoryUpdate();
    };
    const queueStoryUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateStory);
    };
    const centerStory = () => {
      const top = Math.max(0, (window.innerHeight - sticky.offsetHeight) / 2);
      heroDevice.style.setProperty('--story-center-top', `${top.toFixed(1)}px`);
      const stageBounds = stage.getBoundingClientRect();
      const screenshotScale = stageBounds.width * 1.1 / 2414;
      const cardWidth = capturedCard.width * screenshotScale;
      const cardCenterX = -stageBounds.width * .05 + (capturedCard.left + capturedCard.width / 2) * screenshotScale;
      const cardCenterY = -stageBounds.height * .05 + (capturedCard.top + capturedCard.height / 2) * screenshotScale;
      const productScale = cardWidth / 620;
      heroDevice.style.setProperty('--product-left', `${cardCenterX.toFixed(2)}px`);
      heroDevice.style.setProperty('--product-top', `${cardCenterY.toFixed(2)}px`);
      heroDevice.style.setProperty('--product-scale', productScale.toFixed(3));
      heroDevice.style.setProperty('--selection-outset', `${(20 / productScale).toFixed(2)}px`);
      heroDevice.style.setProperty('--selection-padding', `${(40 / productScale).toFixed(2)}px`);
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
