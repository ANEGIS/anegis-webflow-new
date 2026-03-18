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

  // Make native anchor links (<a href="#id">) work with Lenis smooth scroll.
  // Without this, Lenis hijacks the scroll mechanism and anchor jumps are suppressed.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e: MouseEvent) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target || !lenisInstance) return;
      e.preventDefault();
      lenisInstance.scrollTo(target as HTMLElement, { offset: 0 });
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
