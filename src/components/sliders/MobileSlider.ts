/**
 * Mobile Slider Component
 *
 * Initializes Swiper instances on elements with [data-slider-mobile] attribute
 * only on tablet and below (≤991px). Handles resize events to properly
 * initialize/destroy sliders when crossing the breakpoint.
 *
 * Expected HTML structure:
 * <div data-slider-mobile class="swiper">
 *   <div class="swiper-wrapper">
 *     <div class="swiper-slide">...</div>
 *     <div class="swiper-slide">...</div>
 *   </div>
 * </div>
 */

interface SwiperInstance {
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
}

interface SwiperOptions {
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  loop?: boolean;
  centeredSlides?: boolean;
  freeMode?: boolean;
  watchOverflow?: boolean;
}

declare class Swiper {
  constructor(element: HTMLElement, options: SwiperOptions);
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
}

// Store active slider instances
const activeSliders = new Map<HTMLElement, SwiperInstance>();

// Tablet and below breakpoint
const MOBILE_BREAKPOINT = 991;

/**
 * Check if we're on mobile/tablet
 */
function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Initialize a single slider
 */
function initSlider(element: HTMLElement): void {
  if (activeSliders.has(element)) return; // Already initialized

  const options: SwiperOptions = {
    slidesPerView: 'auto',
    spaceBetween: 0,
    loop: false,
    freeMode: false,
    watchOverflow: true,
  };

  const instance = new Swiper(element, options);
  activeSliders.set(element, instance);
}

/**
 * Destroy a single slider
 */
function destroySlider(element: HTMLElement): void {
  const instance = activeSliders.get(element);
  if (instance) {
    instance.destroy(true, true);
    activeSliders.delete(element);
  }
}

/**
 * Get all slider elements
 */
function getSliderElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-slider-mobile]'));
}

/**
 * Handle all sliders based on current viewport
 */
function handleSliders(): void {
  const sliders = getSliderElements();
  const mobile = isMobile();

  sliders.forEach((slider) => {
    if (mobile) {
      initSlider(slider);
    } else {
      destroySlider(slider);
    }
  });
}

/**
 * Debounce utility
 */
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Initialize mobile sliders
 */
export function initMobileSliders(): void {
  if (typeof Swiper === 'undefined') {
    console.error('[MobileSlider] Swiper is not loaded');
    return;
  }

  const sliders = getSliderElements();
  if (sliders.length === 0) return;

  // Initial check
  handleSliders();

  // Handle resize with debounce
  const debouncedHandler = debounce(handleSliders, 150);
  window.addEventListener('resize', debouncedHandler);
}
