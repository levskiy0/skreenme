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

  const particleLayers = Array.from(document.querySelectorAll('.faq-particles'));
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
