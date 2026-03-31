interface GSAP {
  to(target: Element | NodeList | string | readonly Element[], vars: Record<string, unknown>): void;
  set(
    target: Element | NodeList | string | readonly Element[],
    vars: Record<string, unknown>
  ): void;
}

declare const gsap: GSAP;

type Direction = 'next' | 'prev';

/**
 * Sets up a single-item slot-machine rotator for a side list (solutions / benefits).
 * Container is clipped to exactly 1 item height. On each advance, the track slides
 * in the same direction as the main slider, then DOM-rotates and resets — seamless loop.
 */
function setupSideList(wrapperEl: HTMLElement, staggerMs = 0): ((dir: Direction) => void) | null {
  const trackEl = wrapperEl.querySelector('.w-dyn-items') as HTMLElement | null;
  if (!trackEl) return null;

  const items = Array.from(trackEl.children) as HTMLElement[];
  if (items.length < 2) return null;

  const itemH = items[0].offsetHeight;
  if (itemH === 0) return null;

  // Wrap track in a tight clipping div so only 1 item is visible
  const clip = document.createElement('div');
  clip.style.cssText = `height: ${itemH}px; overflow: hidden; position: relative;`;
  trackEl.parentNode!.insertBefore(clip, trackEl);
  clip.appendChild(trackEl);
  trackEl.style.willChange = 'transform';

  let busy = false;

  return function advance(dir: Direction): void {
    if (busy) return;
    busy = true;

    // Slide in the same direction as the main slider:
    //   next → track moves UP  (y: 0 → -itemH)
    //   prev → track moves DOWN (y: 0 → +itemH)
    const targetY = dir === 'next' ? -itemH : itemH;

    gsap.to(trackEl, {
      y: targetY,
      delay: staggerMs / 1000,
      duration: 0.48,
      ease: 'power3.inOut',
      onComplete() {
        // DOM rotation — always brings the correct item back to position 0
        if (dir === 'next') {
          trackEl.appendChild(trackEl.firstElementChild!);
        } else {
          trackEl.insertBefore(trackEl.lastElementChild!, trackEl.firstChild);
        }
        // Snap back — viewer never sees this because it's post-animation
        gsap.set(trackEl, { y: 0 });
        busy = false;
      },
    });
  };
}

/**
 * CMS Flow – Synchronized Three-Panel Rotator
 *
 * Left col  : 3 challenges visible, middle = active (.is-active), infinite DOM-rotation.
 * Right cols : solutions + benefits each show 1 item, slot-machine in the same direction.
 *
 * All panels fire together on arrow click. Benefits staggered 40 ms for a cascade feel.
 *
 * DOWN (goNext) → content scrolls UP, "next" set of items enters from below.
 * UP   (goPrev) → content scrolls DOWN, "previous" set enters from above.
 */
export function initCMSFlow() {
  document.querySelectorAll('.content_wrapper-outer').forEach((wrapperEl) => {
    const wrapper = wrapperEl as HTMLElement;

    // --- Main slider ---
    const rawTrack = wrapper.querySelector('[data-scroll="vertical"]') as HTMLElement | null;
    const upArrow = wrapper.querySelector('.content-arrow.is-top');
    const downArrow = wrapper.querySelector('.content-arrow:not(.is-top)');

    if (!rawTrack) return;
    // Definitive non-null binding so TypeScript narrows correctly inside closures
    const track: HTMLElement = rawTrack;

    const items = Array.from(track.querySelectorAll('.content-col-item')) as HTMLElement[];
    if (items.length < 3) return;

    // --- Side lists ---
    const solutionsWrapper = wrapper.querySelector('.solutions_list-wrapper') as HTMLElement | null;
    const benefitsWrapper = wrapper.querySelector(
      '.benefits_collection-wrapper'
    ) as HTMLElement | null;

    const advanceSolutions = solutionsWrapper ? setupSideList(solutionsWrapper, 0) : null;
    const advanceBenefits = benefitsWrapper ? setupSideList(benefitsWrapper, 40) : null;

    // --- Measure step from rendered positions ---
    const rect0 = items[0].getBoundingClientRect();
    const rect1 = items[1].getBoundingClientRect();
    const step = rect1.top - rect0.top;
    const gap = step - rect0.height;
    const viewportHeight = Math.max(3 * rect0.height + 2 * gap, 401);

    // --- Clipped viewport for main track ---
    const viewport = document.createElement('div');
    viewport.style.cssText = `height: ${viewportHeight}px; overflow: hidden; position: relative;`;
    track.parentNode!.insertBefore(viewport, track);
    viewport.appendChild(track);

    const totalTrackHeight = items.length * step - gap;
    track.style.cssText += `; overflow: visible !important; height: ${totalTrackHeight}px !important; min-height: 0 !important; max-height: none !important; will-change: transform;`;

    // --- Initial arrangement: active item at index 1 (middle of 3 visible) ---
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

    // goNext — content scrolls UP, next items enter from below
    function goNext() {
      if (isAnimating) return;
      isAnimating = true;

      advanceSolutions?.('next');
      advanceBenefits?.('next');

      // Animate first, then DOM-rotate at the end — prev exits the top before the DOM moves,
      // so the snap-back (gsap.set y→0) is invisible to the user.
      gsap.to(track, {
        y: -step,
        duration: 0.5,
        ease: 'power3.inOut',
        onComplete() {
          const first = track.firstElementChild as HTMLElement;
          track.appendChild(first);
          gsap.set(track, { y: 0 });
          syncActive();
          isAnimating = false;
        },
      });
    }

    // goPrev — content scrolls DOWN, previous items enter from above
    function goPrev() {
      if (isAnimating) return;
      isAnimating = true;

      advanceSolutions?.('prev');
      advanceBenefits?.('prev');

      // DOM-first: move last to front, compensate y, animate to 0
      const all = Array.from(track.querySelectorAll('.content-col-item'));
      const last = all[all.length - 1] as HTMLElement;
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

    // --- Autoplay: advance every 4 s, pause on hover ---
    const AUTOPLAY_INTERVAL = 4000;
    let autoplayTimer: ReturnType<typeof setInterval> | null = null;

    function startAutoplay() {
      if (autoplayTimer !== null) return;
      autoplayTimer = setInterval(goNext, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
      if (autoplayTimer === null) return;
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);

    upArrow?.addEventListener('click', () => {
      stopAutoplay();
      goPrev();
      startAutoplay();
    });
    downArrow?.addEventListener('click', () => {
      stopAutoplay();
      goNext();
      startAutoplay();
    });

    startAutoplay();
  });
}
