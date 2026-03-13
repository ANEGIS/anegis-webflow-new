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
  slides: HTMLElement[];
  activeIndex: number;
  realIndex?: number;
  slideTo: (index: number) => void;
}

interface SwiperOptions {
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  loop?: boolean;
  centeredSlides?: boolean;
  freeMode?: boolean;
  watchOverflow?: boolean;
  breakpoints?: {
    [width: number]: Omit<SwiperOptions, 'breakpoints' | 'on'>;
  };
  navigation?: {
    nextEl: HTMLElement | null;
    prevEl: HTMLElement | null;
  };
  on?: {
    init?: (this: SwiperInstance) => void;
    slideChange?: (this: SwiperInstance) => void;
  };
}

declare class Swiper {
  constructor(element: HTMLElement, options: SwiperOptions);
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
  slides: HTMLElement[];
  activeIndex: number;
  realIndex?: number;
  slideTo: (index: number) => void;
}

// Store active slider instances and their original slide styles
const activeSliders = new Map<HTMLElement, SwiperInstance>();
const originalStyles = new Map<HTMLElement, Map<HTMLElement, CSSStyleDeclaration>>();

// Tablet and below breakpoint
const MOBILE_BREAKPOINT = 991;

/**
 * Check if we're on mobile/tablet
 */
function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Update the progress bar width
 */
function updateProgress(instance: SwiperInstance, progressThumb: HTMLElement) {
  const total = instance.slides.length;
  const current =
    (instance.realIndex !== undefined ? instance.realIndex : instance.activeIndex) + 1;
  const percentage = (current / total) * 100;
  progressThumb.style.width = percentage + '%';
  progressThumb.style.transition = 'width 0.3s ease';
}

/**
 * Initialize a single slider
 */
function initSlider(element: HTMLElement): void {
  if (activeSliders.has(element)) return; // Already initialized

  // Read data-mobile-slides attribute, fallback to 1 if not present
  const mobileSlides = element.getAttribute('data-mobile-slides');
  const slidesPerView = mobileSlides ? parseFloat(mobileSlides) : 1;

  // Read optional space between slides
  const spaceAttr = element.getAttribute('data-mobile-space');
  const spaceBetween = spaceAttr ? parseFloat(spaceAttr) : 16;

  // Try to find arrows inside the swiper, or in the parent container
  const parent = element.parentElement;
  let nextEl = element.querySelector('.swiper-arrow.is-next') as HTMLElement | null;
  let prevEl = element.querySelector('.swiper-arrow.is-prev') as HTMLElement | null;

  // If not found inside, check parent container
  if (!nextEl && parent) {
    nextEl = parent.querySelector('.swiper-arrow.is-next') as HTMLElement | null;
  }
  if (!prevEl && parent) {
    prevEl = parent.querySelector('.swiper-arrow.is-prev') as HTMLElement | null;
  }

  // Progress elements (check inside element and in parent)
  let progressTrack = element.querySelector('.swiper-progress-track') as HTMLElement | null;
  let progressThumb = element.querySelector('.swiper-progress-thumb') as HTMLElement | null;
  if (!progressTrack && parent) {
    progressTrack = parent.querySelector('.swiper-progress-track') as HTMLElement | null;
  }
  if (!progressThumb && parent) {
    progressThumb = parent.querySelector('.swiper-progress-thumb') as HTMLElement | null;
  }

  // Store original styles before modifying
  const slides = element.querySelectorAll<HTMLElement>('.swiper-slide');
  const wrapper = element.querySelector<HTMLElement>('.swiper-wrapper');
  const styleMap = new Map<HTMLElement, CSSStyleDeclaration>();

  if (wrapper) {
    const originalStyle = wrapper.style.cssText;
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = originalStyle;
    styleMap.set(wrapper, tempDiv.style);

    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.gap = '0';
    wrapper.style.gridGap = '0';
  }

  slides.forEach((slide) => {
    // Clone the current inline style
    const originalStyle = slide.style.cssText;
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = originalStyle;
    styleMap.set(slide, tempDiv.style);

    // Reset slide styles so Swiper can control them properly
    slide.style.width = ''; // Clear any fixed width - Swiper will set this
    slide.style.minWidth = '0'; // Allow shrinking if needed
    slide.style.maxWidth = 'none'; // Remove max-width constraints
    slide.style.flexBasis = 'auto'; // Reset flex-basis to allow width control
    slide.style.flexShrink = '0'; // Prevent flex shrinking
    slide.style.boxSizing = 'border-box'; // Ensure padding doesn't affect width
    slide.style.display = 'block'; // Ensure block display
  });

  originalStyles.set(element, styleMap);

  // NOTE: slidesPerView calculation
  // slidesPerView: 1.9 means "fit 1.9 slides in viewport"
  // Each slide width = 100% / 1.9 = 52.6%
  // Result: You see ~2 slides (1 full + 90% of next)
  // For "1 slide + 10% peek", use slidesPerView: 1.1

  const desktopSlidesAttr = element.getAttribute('data-desktop-slides');
  const desktopSlides = desktopSlidesAttr ? parseFloat(desktopSlidesAttr) : 3.5;

  const options: SwiperOptions = {
    slidesPerView: slidesPerView,
    spaceBetween: spaceBetween,
    loop: false,
    freeMode: false,
    watchOverflow: true,
    breakpoints: {
      992: {
        slidesPerView: desktopSlides,
        spaceBetween: 0,
      },
    },
    navigation: {
      nextEl: nextEl,
      prevEl: prevEl,
    },
    on: {
      init: function (this: SwiperInstance) {
        if (progressThumb) updateProgress(this, progressThumb);
      },
      slideChange: function (this: SwiperInstance) {
        if (progressThumb) updateProgress(this, progressThumb);
      },
    },
  };

  const instance = new Swiper(element, options);
  activeSliders.set(element, instance);

  // Click to scrub on progress bar
  if (progressTrack) {
    if (!progressTrack.hasAttribute('data-progress-listener')) {
      progressTrack.addEventListener('click', function (e) {
        const swiperInstance = activeSliders.get(element);
        if (!swiperInstance) return;
        const event = e as MouseEvent;
        const rect = progressTrack.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const trackWidth = rect.width;
        const clickRatio = clickX / trackWidth;
        const totalSlides = swiperInstance.slides.length;
        const targetIndex = Math.floor(clickRatio * totalSlides);
        swiperInstance.slideTo(targetIndex);
      });
      progressTrack.setAttribute('data-progress-listener', 'true');
    }
  }
}

/**
 * Destroy a single slider
 */
function destroySlider(element: HTMLElement): void {
  const instance = activeSliders.get(element);
  if (instance) {
    instance.destroy(true, true);
    activeSliders.delete(element);

    // Restore original slide styles
    const styleMap = originalStyles.get(element);
    if (styleMap) {
      styleMap.forEach((originalStyle, slide) => {
        slide.style.cssText = originalStyle.cssText;
      });
      originalStyles.delete(element);
    }
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
    let shouldInit = mobile;

    if (!mobile) {
      const wrapper = slider.querySelector('.swiper-wrapper');
      if (wrapper && wrapper.children.length > 4) {
        shouldInit = true;
      }
    }

    if (shouldInit) {
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
  if (typeof Swiper === 'undefined') return;

  const sliders = getSliderElements();

  if (sliders.length === 0) return;

  // Initial check
  handleSliders();

  // Handle resize with debounce
  const debouncedHandler = debounce(handleSliders, 150);
  window.addEventListener('resize', debouncedHandler);
}
