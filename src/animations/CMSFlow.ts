interface GSAP {
  to(target: Element | NodeList | string | readonly Element[], vars: Record<string, unknown>): void;
  fromTo(
    target: Element | NodeList | string | readonly Element[],
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>
  ): void;
  set(
    target: Element | NodeList | string | readonly Element[],
    vars: Record<string, unknown>
  ): void;
}

declare const gsap: GSAP;

type Direction = 'next' | 'prev';

// Webflow breakpoints
const TABLET_MAX = 991; // tablet and below
const MOBILE_MAX = 767; // mobile landscape and below

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

    const targetY = dir === 'next' ? -itemH : itemH;

    gsap.to(trackEl, {
      y: targetY,
      delay: staggerMs / 1000,
      duration: 0.48,
      ease: 'power3.inOut',
      onComplete() {
        if (dir === 'next') {
          trackEl.appendChild(trackEl.firstElementChild!);
        } else {
          trackEl.insertBefore(trackEl.lastElementChild!, trackEl.firstChild);
        }
        gsap.set(trackEl, { y: 0 });
        busy = false;
      },
    });
  };
}

/**
 * CMS Flow – Synchronized Three-Panel Rotator
 *
 * Desktop (>991px):
 *   Left col  : 3 challenges visible vertically, middle = active. Infinite DOM-rotation.
 *   Right cols : solutions + benefits slot-machine in sync. Benefits staggered 40 ms.
 *   DOWN (goNext) → scrolls UP. UP (goPrev) → scrolls DOWN.
 *
 * Tablet (768–991px):
 *   Left col becomes a horizontal carousel — 3 items visible, middle = active.
 *   Side lists advance in sync.
 *
 * Mobile landscape and below (≤767px):
 *   Horizontal carousel — 1 item visible at a time.
 *   Side lists advance in sync.
 *
 * Arrows: .content-arrow.is-top = prev, .content-arrow = next (all breakpoints).
 */
export function initCMSFlow() {
  document.querySelectorAll('.content_wrapper-outer').forEach((wrapperEl) => {
    const wrapper = wrapperEl as HTMLElement;
    const w = window.innerWidth;
    const isHorizontal = w <= TABLET_MAX;
    const isMobile = w <= MOBILE_MAX;

    // --- Elements ---
    const rawTrack = wrapper.querySelector('[data-scroll="vertical"]') as HTMLElement | null;
    const upArrow = wrapper.querySelector('.content-arrow.is-top');
    const downArrow = wrapper.querySelector('.content-arrow:not(.is-top)');

    if (!rawTrack) return;
    const track: HTMLElement = rawTrack;

    const items = Array.from(track.querySelectorAll('.content-col-item')) as HTMLElement[];
    if (items.length < 2) return;

    // Flatten items to direct children of track (remove CMS wrapper nesting)
    items.forEach((item) => track.appendChild(item));
    track.querySelector('.slider_collection-wrapper')?.remove();

    // --- Side lists (all breakpoints) ---
    const solutionsWrapper = wrapper.querySelector('.solutions_list-wrapper') as HTMLElement | null;
    const benefitsWrapper = wrapper.querySelector(
      '.benefits_collection-wrapper'
    ) as HTMLElement | null;

    const advanceSolutions = solutionsWrapper ? setupSideList(solutionsWrapper, 0) : null;
    const advanceBenefits = benefitsWrapper ? setupSideList(benefitsWrapper, 40) : null;

    // ─────────────────────────────────────────────────────────
    // HORIZONTAL — tablet (3 visible) or mobile (1 visible)
    // ─────────────────────────────────────────────────────────
    if (isHorizontal) {
      // Active item is always at DOM index 1 (center) for both tablet and mobile peek
      const activeSlot = 1;

      // Tablet : 3 full items side-by-side, natural item width
      // Mobile  : viewport = full column width, each item = colWidth / 1.5
      //           so 0.25 of a slide peeks on each side of the centered full slide
      const colEl = track.parentElement as HTMLElement;
      const itemW = isMobile ? colEl.offsetWidth / 1.5 : items[0].offsetWidth;
      const viewportW = isMobile ? colEl.offsetWidth : 3 * itemW;
      // On mobile the track rests at -0.75*itemW so item[1] is perfectly centered
      const baseX = isMobile ? -0.75 * itemW : 0;

      // Style items for horizontal row
      items.forEach((item) => {
        item.style.cssText += `; flex-shrink: 0; width: ${itemW}px;`;
      });

      // Need at least 4 items: left-peek + center + right-peek + 1 off-screen for swap
      const MIN_ITEMS = 4;
      const srcCount = items.length;
      while (items.length < MIN_ITEMS) {
        const clone = items[items.length % srcCount].cloneNode(true) as HTMLElement;
        clone.removeAttribute('id');
        track.appendChild(clone);
        items.push(clone);
      }

      // Style track as horizontal flex strip
      track.style.cssText = `display: flex; flex-direction: row; will-change: transform; overflow: visible !important; width: ${items.length * itemW}px !important; height: auto !important; min-height: 0 !important; max-height: none !important;`;

      // Clipped viewport
      const viewport = document.createElement('div');
      viewport.style.cssText = `width: ${viewportW}px; overflow: hidden; position: relative;`;
      track.parentNode!.insertBefore(viewport, track);
      viewport.appendChild(track);

      // Initial arrangement: active item at index 1
      let activeIdx = items.findIndex((item) => item.classList.contains('is-active'));
      if (activeIdx === -1) activeIdx = 0;
      const targetFirstIdx = (activeIdx - activeSlot + items.length) % items.length;
      for (let i = 0; i < targetFirstIdx; i++) {
        const el = track.querySelector('.content-col-item');
        if (el) track.appendChild(el);
      }

      function syncActive() {
        Array.from(track.querySelectorAll('.content-col-item')).forEach((el, i) => {
          el.classList.toggle('is-active', i === activeSlot);
        });
      }

      gsap.set(track, { x: baseX });
      syncActive();

      let isAnimating = false;

      // goNext — slide LEFT, next item enters from the right
      function goNext() {
        if (isAnimating) return;
        isAnimating = true;

        advanceSolutions?.('next');
        advanceBenefits?.('next');

        gsap.to(track, {
          x: baseX - itemW,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete() {
            const first = track.firstElementChild as HTMLElement;
            track.appendChild(first);
            gsap.set(track, { x: baseX });
            syncActive();
            isAnimating = false;
          },
        });
      }

      // goPrev — slide RIGHT, previous item enters from the left
      function goPrev() {
        if (isAnimating) return;
        isAnimating = true;

        advanceSolutions?.('prev');
        advanceBenefits?.('prev');

        const all = Array.from(track.querySelectorAll('.content-col-item'));
        const last = all[all.length - 1] as HTMLElement;
        track.insertBefore(last, track.firstElementChild);
        gsap.fromTo(
          track,
          { x: baseX - itemW },
          {
            x: baseX,
            duration: 0.5,
            ease: 'power3.inOut',
            onComplete() {
              syncActive();
              isAnimating = false;
            },
          }
        );
      }

      // --- Autoplay ---
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
      return;
    }

    // ─────────────────────────────────────────────────────────
    // VERTICAL — desktop (original behaviour, unchanged)
    // ─────────────────────────────────────────────────────────
    if (items.length < 3) return;

    // --- Measure step from rendered positions ---
    const rect0 = items[0].getBoundingClientRect();
    const rect1 = items[1].getBoundingClientRect();
    const step = rect1.top - rect0.top;
    const gap = step - rect0.height;
    const viewportHeight = Math.max(3 * rect0.height + 2 * gap, 381);

    // --- Ensure enough items for smooth loop ---
    const MIN_ITEMS = 4;
    const srcCount = items.length;
    while (items.length < MIN_ITEMS) {
      const clone = items[items.length % srcCount].cloneNode(true) as HTMLElement;
      clone.removeAttribute('id');
      track.appendChild(clone);
      items.push(clone);
    }

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

      const all = Array.from(track.querySelectorAll('.content-col-item'));
      const last = all[all.length - 1] as HTMLElement;
      track.insertBefore(last, track.firstElementChild);
      gsap.fromTo(
        track,
        { y: -step },
        {
          y: 0,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete() {
            syncActive();
            isAnimating = false;
          },
        }
      );
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
