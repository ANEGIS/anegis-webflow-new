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
 * UP   → set y=-step FIRST (no flash), move last child to start, animate y: -step → 0
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

    // At least 400px tall
    const viewportHeight = Math.max(3 * rect0.height + 2 * gap, 401);

    // --- Create clipped viewport (arrows stay outside the clip) ---
    const viewport = document.createElement('div');
    viewport.style.cssText = `height: ${viewportHeight}px; overflow: hidden; position: relative;`;
    track.parentNode?.insertBefore(viewport, track);
    viewport.appendChild(track);

    // Force the track to be tall enough for ALL items
    const totalTrackHeight = items.length * step - gap;
    track.style.cssText += `; overflow: visible !important; height: ${totalTrackHeight}px !important; min-height: 0 !important; max-height: none !important; will-change: transform;`;

    // --- Initial arrangement: active item in the MIDDLE (index 1 of 3) ---
    let activeIdx = items.findIndex((item) => item.classList.contains('is-active'));
    if (activeIdx === -1) activeIdx = 0;

    const prevIdx = (activeIdx - 1 + items.length) % items.length;
    for (let i = 0; i < prevIdx; i++) {
      const el = track.querySelector('.content-col-item');
      if (el) track.appendChild(el);
    }

    function syncActive() {
      Array.from(track.querySelectorAll('.content-col-item')).forEach((el, i) => {
        el.classList.toggle('is-active', i === 1);
      });
    }

    gsap.set(track, { y: 0 });
    syncActive();

    let isAnimating = false;

    // DOWN arrow → next item
    function goNext() {
      if (isAnimating) return;
      isAnimating = true;

      // Mirror of goPrev: move first to end, compensate y, then animate to 0.
      // This avoids blank space — no 4th item needed during animation.
      const first = track.firstElementChild as HTMLElement;
      track.appendChild(first);
      gsap.set(track, { y: step });

      gsap.to(track, {
        y: 0,
        duration: 0.5,
        ease: 'power3.inOut',
        onComplete() {
          syncActive();
          isAnimating = false;
        },
      });
    }

    // UP arrow → previous item
    function goPrev() {
      if (isAnimating) return;
      isAnimating = true;

      const all = Array.from(track.querySelectorAll('.content-col-item'));
      const last = all[all.length - 1];

      // DOM change first, then compensate — mirrors goNext pattern exactly.
      // If GSAP batches its update to the next paint, DOM-first ensures the
      // arriving item is always in the DOM before any transform is visible.
      track.insertBefore(last, track.firstChild);
      gsap.set(track, { y: -step });

      gsap.to(track, {
        y: 0,
        duration: 0.5,
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
