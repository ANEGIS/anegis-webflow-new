// Assuming Swiper is loaded globally via Webflow
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
    nextEl: string;
    prevEl: string;
  };
  breakpoints?: Record<number, { slidesPerView: number }>;
  on?: {
    init?: (this: SwiperInstance) => void;
    slideChange?: (this: SwiperInstance) => void;
  };
}

declare class Swiper {
  constructor(selector: string, options: SwiperOptions);
  slides: HTMLElement[];
  slideTo(index: number): void;
}

export function initSwiperSlider() {
  if (typeof Swiper === 'undefined') return;

  // Select progress elements
  const progressTrack = document.querySelector('.swiper-progress-track');
  const progressThumb = document.querySelector('.swiper-progress-thumb') as HTMLElement;

  const swiperInstance = new Swiper('.swiper.w-dyn-list', {
    // Layout
    slidesPerView: 1,
    spaceBetween: 36,
    loop: false,
    centeredSlides: true,

    // Navigation
    navigation: {
      nextEl: '.swiper-arrow.is-next',
      prevEl: '.swiper-arrow.is-prev',
    },

    // Responsive
    breakpoints: {
      768: { slidesPerView: 1 },
      1024: { slidesPerView: 1 },
    },

    // Events
    on: {
      init: function (this: SwiperInstance) {
        updateScale(this);
        updateProgress(this);
      },
      slideChange: function (this: SwiperInstance) {
        updateScale(this);
        updateProgress(this);
      },
    },
  });

  // --- NEW: Click to Scrub ---
  if (progressTrack) {
    progressTrack.addEventListener('click', function (e) {
      const event = e as MouseEvent;
      // 1. Get the click position relative to the track
      const rect = progressTrack.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const trackWidth = rect.width;

      // 2. Calculate which slide that represents (0 to total-1)
      const clickRatio = clickX / trackWidth;
      const totalSlides = swiperInstance.slides.length;
      const targetIndex = Math.floor(clickRatio * totalSlides);

      // 3. Move Swiper
      swiperInstance.slideTo(targetIndex);
    });
  }
  // ---------------------------

  function updateScale(instance: SwiperInstance) {
    instance.slides.forEach(function (slide: HTMLElement, index: number) {
      if (index === instance.activeIndex) {
        slide.style.transform = 'scale(1)';
        slide.style.transition = 'transform 0.4s ease';
      } else {
        slide.style.transform = 'scale(0.9)';
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
}
