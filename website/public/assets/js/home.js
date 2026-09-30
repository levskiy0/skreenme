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
    if (!reducedMotion.matches) {
      const sticky = heroDevice.querySelector('.hero-story-sticky');
      const stage = heroDevice.querySelector('.hero-story-stage');
      const keys = Array.from(heroDevice.querySelectorAll('[data-story-key]'));
      const clamp = (value) => Math.max(0, Math.min(1, value));
      const ramp = (value, start, end) => clamp((value - start) / (end - start));
      const keyReveals = [[0, .035], [.045, .08], [.09, .125]];
      const keyPresses = [.18, .25, .32];
      const introMovePerSecond = 1.25;
      const chapters = [
        { trigger: .015, end: .35, duration: 1400 },
        { trigger: .15, end: .70, duration: 1400 },
        { trigger: .32, end: 1, duration: 1500 },
      ];
      const smooth = (value) => value * value * (3 - 2 * value);
      // Bounds of the product card inside the white screenshot frame (2414 × 1650).
      const capturedCard = { left: 548, top: 444, width: 1300, height: 752 };
      let keyWidths = [0, 0, 0];
      let frame = 0;
      let previousFrameTime = 0;
      let previousScrollY = window.scrollY;
      let storyExtraHeight = 0;
      let displayedProgress = null;
      let displayedMove = null;
      let requestedProgress = 0;
      const approach = (current, target, distance) => current + Math.sign(target - current) * Math.min(Math.abs(target - current), distance);
      const scrollChapter = (rawProgress) => {
        let chapter = 0;
        for (const step of chapters) {
          if (rawProgress < step.trigger) break;
          chapter = step.end;
        }
        return chapter;
      };
      const playChapters = (from, to, elapsedMs) => {
        let progress = from;
        let remaining = elapsedMs;
        for (let index = 0; index < chapters.length && progress < to - .001 && remaining > 0; index += 1) {
          const step = chapters[index];
          if (progress >= step.end - .001) continue;
          const start = index ? chapters[index - 1].end : 0;
          const speed = (step.end - start) / step.duration;
          const end = Math.min(step.end, to);
          const needed = (end - progress) / speed;
          if (remaining >= needed) {
            progress = end;
            remaining -= needed;
          } else {
            progress += speed * remaining;
            remaining = 0;
          }
        }
        return Math.min(progress, to);
      };

      const updateStory = (timestamp = performance.now()) => {
        frame = 0;
        const bounds = heroDevice.getBoundingClientRect();
        const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
        const scrollable = Math.max(1, bounds.height - sticky.offsetHeight);
        const rawProgress = clamp((stickyTop - bounds.top) / scrollable);
        const chapterProgress = scrollChapter(rawProgress);
        const targetMove = clamp(window.scrollY / Math.max(1, bounds.top + window.scrollY - stickyTop));
        const scrollingBackward = window.scrollY < previousScrollY - 1;
        const scrollingForward = window.scrollY > previousScrollY + 1;
        if (displayedProgress === null || document.hidden || scrollingBackward) {
          displayedProgress = chapterProgress;
          displayedMove = targetMove;
          requestedProgress = chapterProgress;
        } else {
          const elapsed = Math.max(0, Math.min(timestamp - previousFrameTime, 100));
          if (scrollingForward) requestedProgress = Math.max(requestedProgress, chapterProgress);
          displayedProgress = playChapters(displayedProgress, requestedProgress, elapsed);
          displayedMove = approach(displayedMove, targetMove, introMovePerSecond * elapsed / 1000);
        }
        previousFrameTime = timestamp;
        previousScrollY = window.scrollY;
        if (scrollingBackward && bounds.top >= stickyTop) {
          storyExtraHeight = 0;
          heroDevice.style.removeProperty('--story-extra-height');
        } else if (!document.hidden && requestedProgress - displayedProgress > .001) {
          const neededHeight = window.innerHeight + sticky.offsetHeight - bounds.bottom;
          if (neededHeight > 0) {
            storyExtraHeight += Math.ceil(neededHeight);
            heroDevice.style.setProperty('--story-extra-height', `${storyExtraHeight}px`);
          }
        }
        const progress = displayedProgress;
        const move = displayedMove;
        const introOpacity = 1 - clamp((move - .30) / .60);
        const introOffset = move * Math.min(window.innerHeight * 1.3, 1200);
        const selectionProgress = ramp(progress, .49, .66);
        const captureFlash = ramp(progress, .675, .72) * (1 - ramp(progress, .72, .78));
        const selectionOpacity = ramp(progress, .48, .51) * (1 - ramp(progress, .68, .71));
        const productOpacity = ramp(progress, .39, .46) * (1 - ramp(progress, .70, .79));
        const editorPop = smooth(ramp(progress, .71, .84));
        const resultOpacity = smooth(ramp(progress, .88, .99));

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
        heroDevice.style.setProperty('--capture-flash-opacity', captureFlash.toFixed(3));
        heroDevice.style.setProperty('--intro-opacity', introOpacity.toFixed(3));
        heroDevice.style.setProperty('--intro-offset', `${introOffset.toFixed(1)}px`);
        heroDevice.style.setProperty('--selection-progress', selectionProgress.toFixed(3));
        heroDevice.style.setProperty('--selection-opacity', selectionOpacity.toFixed(3));
        heroDevice.style.setProperty('--product-opacity', productOpacity.toFixed(3));
        heroDevice.style.setProperty('--editor-opacity', editorPop.toFixed(3));
        heroDevice.style.setProperty('--editor-rise', `${(48 * (1 - editorPop)).toFixed(1)}px`);
        heroDevice.style.setProperty('--editor-scale', (.94 + .06 * editorPop).toFixed(3));
        heroDevice.style.setProperty('--result-opacity', resultOpacity.toFixed(3));
        if (!document.hidden && (Math.abs(requestedProgress - progress) > .001 || Math.abs(targetMove - move) > .001)) queueStoryUpdate();
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
