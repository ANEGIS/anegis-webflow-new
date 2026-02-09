interface SwiperInstance {
  slides: HTMLElement[];
  activeIndex: number;
  realIndex: number;
  slideTo(index: number): void;
}

interface SwiperOptions {
  slidesPerView?: number;
  spaceBetween?: number;
  loop?: boolean;
  centeredSlides?: boolean;
  navigation?: {
    nextEl: string | HTMLElement | null;
    prevEl: string | HTMLElement | null;
  };
  breakpoints?: Record<number, { slidesPerView: number; centeredSlides?: boolean }>;
  on?: {
    init?: (this: SwiperInstance) => void;
    slideChange?: (this: SwiperInstance) => void;
    slideChangeTransitionStart?: (this: SwiperInstance) => void;
    slideChangeTransitionEnd?: (this: SwiperInstance) => void;
    transitionEnd?: (this: SwiperInstance) => void;
  };
}

declare class Swiper {
  constructor(selector: string | HTMLElement, options: SwiperOptions);
  slides: HTMLElement[];
  slideTo(index: number): void;
}

// Tablet breakpoint
const TABLET_BREAKPOINT = 991;

/**
 * Initialize ALL swipers on the page
 *
 * Sliders with [data-slider-mobile]:
 *   - Handled EXCLUSIVELY by MobileSlider.ts (mobile/tablet only)
 *   - SKIPPED by this function
 *
 * Sliders without [data-slider-mobile] (standard):
 *   - Has scale transform effects
 *   - Has progress bar functionality
 *   - Initialized on ALL screen sizes
 */
export function initSwiperSlider() {
  if (typeof Swiper === 'undefined') return;

  // Select ALL swiper elements, but EXCLUDE mobile-only sliders
  const swiperElements = document.querySelectorAll('.swiper:not([data-slider-mobile])');

  swiperElements.forEach((swiperElement) => {
    const element = swiperElement as HTMLElement;

    // Read data-mobile-slides for mobile slidesPerView (if set)
    const mobileSlides = element.getAttribute('data-mobile-slides');
    const mobileSlidesPerView = mobileSlides ? parseFloat(mobileSlides) : 1;

    // Find navigation arrows (check inside element and in parent)
    const parent = element.parentElement;
    let nextEl = element.querySelector('.swiper-arrow.is-next') as HTMLElement | null;
    let prevEl = element.querySelector('.swiper-arrow.is-prev') as HTMLElement | null;
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

    // Build options for standard sliders (mobile sliders are handled by MobileSlider.ts)
    const options: SwiperOptions = {
      slidesPerView: mobileSlidesPerView, // Mobile value as default
      spaceBetween: 36,
      loop: false,
      centeredSlides: true, // Always center for standard sliders
      navigation: {
        nextEl: nextEl,
        prevEl: prevEl,
      },
      breakpoints: {
        // Above tablet: use 1 slide per view
        [TABLET_BREAKPOINT + 1]: {
          slidesPerView: 1,
          centeredSlides: true,
        },
      },
      // Always add transform effects for standard sliders
      on: {
        init: function (this: SwiperInstance) {
          setTimeout(() => {
            updateScale(this);
            if (progressThumb) updateProgress(this, progressThumb);
          }, 50);
        },
        slideChange: function (this: SwiperInstance) {
          updateScale(this);
          if (progressThumb) updateProgress(this, progressThumb);
        },
        slideChangeTransitionStart: function (this: SwiperInstance) {
          updateScale(this);
        },
        slideChangeTransitionEnd: function (this: SwiperInstance) {
          updateScale(this);
        },
        transitionEnd: function (this: SwiperInstance) {
          updateScale(this);
        },
      },
    };

    const swiperInstance = new Swiper(element, options);

    // Click to scrub on progress bar
    if (progressTrack) {
      progressTrack.addEventListener('click', function (e) {
        const event = e as MouseEvent;
        const rect = progressTrack.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const trackWidth = rect.width;
        const clickRatio = clickX / trackWidth;
        const totalSlides = swiperInstance.slides.length;
        const targetIndex = Math.floor(clickRatio * totalSlides);
        swiperInstance.slideTo(targetIndex);
      });
    }
  });
}

function updateScale(instance: SwiperInstance) {
  instance.slides.forEach(function (slide: HTMLElement, index: number) {
    const isActive =
      index === instance.activeIndex || slide.classList.contains('swiper-slide-active');

    if (isActive) {
      slide.style.transform = 'scale(1)';
      slide.style.transition = 'transform 0.4s ease';
    } else {
      slide.style.transform = 'scale(0.8)';
      slide.style.transition = 'transform 0.4s ease';
    }
  });
}

function updateProgress(instance: SwiperInstance, progressThumb: HTMLElement) {
  const total = instance.slides.length;
  const current = instance.realIndex + 1;
  const percentage = (current / total) * 100;
  progressThumb.style.width = percentage + '%';
}
