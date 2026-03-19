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
 * Sliders with [data-slider-dock]:
 *   - Handled EXCLUSIVELY by DockSlider.ts (mobile landscape/portrait only)
 *   - SKIPPED by this function
 *
 * Sliders without [data-slider-mobile] or [data-slider-dock] (standard):
 *   - Has scale transform effects
 *   - Has progress bar functionality
 *   - Initialized on ALL screen sizes
 */
export function initSwiperSlider() {
  if (typeof Swiper === 'undefined') return;

  // Select ALL swiper elements, but EXCLUDE mobile-only and dock sliders
  const swiperElements = document.querySelectorAll(
    '.swiper:not([data-slider-mobile]):not([data-slider-dock])'
  );

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
      spaceBetween: 0,
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

    // Click and drag to scrub on progress bar
    if (progressTrack) {
      // Create an invisible hit area overlay — keeps the visual bar untouched
      const hitArea = document.createElement('div');
      Object.assign(hitArea.style, {
        position: 'absolute',
        inset: '-12px 0',
        cursor: 'pointer',
        zIndex: '1',
      });
      progressTrack.style.position = 'relative';
      progressTrack.appendChild(hitArea);

      const scrubTo = (clientX: number) => {
        const rect = progressTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const totalSlides = swiperInstance.slides.length;
        swiperInstance.slideTo(Math.min(Math.floor(ratio * totalSlides), totalSlides - 1));
      };

      let isDragging = false;
      hitArea.addEventListener('mousedown', (e) => { isDragging = true; scrubTo(e.clientX); });
      document.addEventListener('mousemove', (e) => { if (isDragging) scrubTo(e.clientX); });
      document.addEventListener('mouseup', () => { isDragging = false; });

      hitArea.addEventListener('touchstart', (e) => { scrubTo(e.touches[0].clientX); }, { passive: true });
      hitArea.addEventListener('touchmove', (e) => { scrubTo(e.touches[0].clientX); }, { passive: true });
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
      slide.style.transform = 'scale(0.9)';
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
