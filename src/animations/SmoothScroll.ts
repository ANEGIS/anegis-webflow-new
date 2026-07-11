/**
 * Smooth Scroll using Lenis
 *
 * Initializes Lenis smooth scrolling on desktop only (>991px).
 * Uses custom easing and manual RAF loop for best performance.
 */

interface LenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  orientation?: 'vertical' | 'horizontal';
  gestureOrientation?: 'vertical' | 'horizontal' | 'both';
  smoothWheel?: boolean;
  wheelMultiplier?: number;
  smoothTouch?: boolean;
  touchMultiplier?: number;
  infinite?: boolean;
  autoRaf?: boolean;
}

declare class Lenis {
  constructor(options: LenisOptions);
  raf: (time: number) => void;
  destroy: () => void;
  stop: () => void;
  start: () => void;
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; immediate?: boolean }
  ) => void;
}

// Desktop breakpoint
const DESKTOP_BREAKPOINT = 991;

// Flag to enable/disable Lenis smooth scroll
const LENIS_ENABLED = true;

let lenisInstance: Lenis | null = null;

/**
 * Initialize Lenis smooth scrolling
 */
export function initSmoothScroll(): void {
  if (!LENIS_ENABLED) {
    return;
  }

  if (typeof Lenis === 'undefined') {
    console.error('[SmoothScroll] Lenis is not loaded');
    return;
  }

  const isDesktop = window.innerWidth > DESKTOP_BREAKPOINT;
  if (!isDesktop) return;

  lenisInstance = new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
    autoRaf: false,
  });

  // Make native anchor links work with Lenis smooth scroll.
  // Webflow nav links use full URLs (https://domain/#section), NOT just #section,
  // so we must match on href*="#" and compare the pathname too.
  document
    .querySelectorAll<HTMLAnchorElement>('a[href*="#"]:not(.w-tab-link)')
    .forEach((anchor) => {
      anchor.addEventListener('click', (e: MouseEvent) => {
        const href = anchor.getAttribute('href');
        if (!href) return;

        // Extract just the hash part
        let hash: string;
        try {
          const url = new URL(href, window.location.href);
          // Only intercept if we're staying on the same page
          if (url.pathname !== window.location.pathname) return;
          hash = url.hash;
        } catch {
          // Malformed URL - try to use it as-is
          hash = href.startsWith('#') ? href : '';
        }

        if (!hash || hash === '#') return;

        const target = document.querySelector(hash);
        if (!target || !lenisInstance) return;

        e.preventDefault();
        e.stopPropagation();
        lenisInstance.scrollTo(target as HTMLElement, { offset: 0, duration: 1.05 });
      });
    });

  function raf(time: number): void {
    lenisInstance?.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

export function stopLenis() {
  lenisInstance?.stop();
}

export function startLenis() {
  lenisInstance?.start();
}
