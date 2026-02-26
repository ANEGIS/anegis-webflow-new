interface GSAP {
  to(target: Element | NodeList | string, vars: Record<string, unknown>): void;
  set(target: Element | NodeList | string, vars: Record<string, unknown>): void;
}

declare const gsap: GSAP;

/**
 * CMS Flow – Seamless Vertical Rotator
 *
 * 3 slides visible. Middle slide is active (.is-active). Infinite loop.
 * DOM rearrangement after each transition for seamless cycling.
 *
 * DOWN → animate y: 0 → -step, move first child to end, reset y=0
 * UP   → move last child to start, set y=-step, animate y: -step → 0
 */
export function initCMSFlow() {
  document.querySelectorAll('.content-col').forEach((flow) => {
    const track = flow.querySelector('[data-scroll="vertical"]') as HTMLElement;
    const upArrow = flow.querySelector('.content-arrow.is-top');
    const downArrow = flow.querySelector('.content-arrow:not(.is-top)');

    if (!track) return;

    const items = Array.from(track.querySelectorAll('.content-col-item')) as HTMLElement[];
    if (items.length < 3) return;

    // --- Measure step from actual rendered positions ---
    const rect0 = items[0].getBoundingClientRect();
    const rect1 = items[1].getBoundingClientRect();
    const step = rect1.top - rect0.top;
    const gap = step - rect0.height;
    const viewportHeight = 3 * rect0.height + 2 * gap;

    // --- Create clipped viewport (arrows stay outside the clip) ---
    const viewport = document.createElement('div');
    viewport.style.height = `${viewportHeight}px`;
    viewport.style.overflow = 'hidden';
    track.parentNode?.insertBefore(viewport, track);
    viewport.appendChild(track);

    // CRITICAL: force the track to be tall enough for ALL items.
    // Webflow CSS may constrain height — override with cssText.
    const totalTrackHeight = items.length * step - gap;
    track.style.cssText += `; overflow: visible !important; height: ${totalTrackHeight}px !important; min-height: 0 !important; max-height: none !important;`;

    // --- Initial arrangement: active item in the MIDDLE (index 1 of 3) ---
    // We need the item BEFORE the active one at position 0
    let activeIdx = items.findIndex((item) => item.classList.contains('is-active'));
    if (activeIdx === -1) activeIdx = 0;

    const prevIdx = (activeIdx - 1 + items.length) % items.length;
    for (let i = 0; i < prevIdx; i++) {
      const el = track.querySelector('.content-col-item');
      if (el) track.appendChild(el);
    }

    gsap.set(track, { y: 0 });
    syncActive();

    let isAnimating = false;

    function syncActive() {
      // Middle item (index 1) is always active
      Array.from(track.querySelectorAll('.content-col-item')).forEach((el, i) => {
        el.classList.toggle('is-active', i === 1);
      });
    }

    // DOWN arrow → next item
    function goNext() {
      if (isAnimating) return;
      isAnimating = true;

      gsap.to(track, {
        y: -step,
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete() {
          // Move first item to end, reset position
          const first = track.querySelector('.content-col-item');
          if (first) track.appendChild(first);
          gsap.set(track, { y: 0 });
          syncActive();
          isAnimating = false;
        },
      });
    }

    // UP arrow → previous item
    function goPrev() {
      if (isAnimating) return;
      isAnimating = true;

      // Move last item to start BEFORE animating
      const all = Array.from(track.querySelectorAll('.content-col-item'));
      const last = all[all.length - 1];
      track.insertBefore(last, track.querySelector('.content-col-item'));

      // Offset so it looks unchanged, then animate into view
      gsap.set(track, { y: -step });
      gsap.to(track, {
        y: 0,
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete() {
          syncActive();
          isAnimating = false;
        },
      });
    }

    upArrow?.addEventListener('click', goPrev);
    downArrow?.addEventListener('click', goNext);
  });
}
