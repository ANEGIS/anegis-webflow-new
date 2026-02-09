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
  breakpoints?: Record<number, { slidesPerView: number }>;
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

/**
 * Initialize standard swipers (those WITHOUT [data-slider-mobile])
 * - Active on all screen sizes
 * - Has scale transform effects
 * - Has progress bar functionality
 */
export function initSwiperSlider() {
  if (typeof Swiper === 'undefined') return;

  // Select swipers WITHOUT data-slider-mobile (those are handled by MobileSlider.ts)
  const swiperElements = document.querySelectorAll('.swiper.w-dyn-list:not([data-slider-mobile])');

  swiperElements.forEach((swiperElement) => {
    const element = swiperElement as HTMLElement;

    // Progress elements scoped to this swiper
    const progressTrack = element.querySelector('.swiper-progress-track') as HTMLElement;
    const progressThumb = element.querySelector('.swiper-progress-thumb') as HTMLElement;

    const swiperInstance = new Swiper(element, {
      slidesPerView: 1,
      spaceBetween: 36,
      loop: false,
      centeredSlides: true,

      navigation: {
        nextEl: element.querySelector('.swiper-arrow.is-next') as HTMLElement | null,
        prevEl: element.querySelector('.swiper-arrow.is-prev') as HTMLElement | null,
      },

      breakpoints: {
        768: { slidesPerView: 1 },
        1024: { slidesPerView: 1 },
      },

      on: {
        init: function (this: SwiperInstance) {
          setTimeout(() => {
            updateScale(this);
            updateProgress(this);
          }, 50);
        },
        slideChange: function (this: SwiperInstance) {
          updateScale(this);
          updateProgress(this);
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
    });

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

    function updateProgress(instance: SwiperInstance) {
      if (!progressThumb) return;
      const total = instance.slides.length;
      const current = instance.realIndex + 1;
      const percentage = (current / total) * 100;
      progressThumb.style.width = percentage + '%';
    }
  });
}
