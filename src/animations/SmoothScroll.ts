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
}

// Desktop breakpoint
const DESKTOP_BREAKPOINT = 991;

/**
 * Initialize Lenis smooth scrolling
 */
export function initSmoothScroll(): void {
  if (typeof Lenis === 'undefined') {
    console.error('[SmoothScroll] Lenis is not loaded');
    return;
  }

  const isDesktop = window.innerWidth > DESKTOP_BREAKPOINT;
  if (!isDesktop) return;

  const lenis = new Lenis({
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

  function raf(time: number): void {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}
