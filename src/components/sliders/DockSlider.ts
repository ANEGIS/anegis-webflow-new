/**
 * Dock Slider Component
 */

interface SwiperInstance {
  slides: HTMLElement[];
  activeIndex: number;
  update: () => void;
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
}

interface SwiperOptions {
  slidesPerView?: number | 'auto';
  slidesPerGroup?: number;
  spaceBetween?: number;
  loop?: boolean;
  centeredSlides?: boolean;
  freeMode?: boolean;
  watchOverflow?: boolean;
  observer?: boolean;
  observeParents?: boolean;
  resizeObserver?: boolean;
  updateOnWindowResize?: boolean;
  navigation?: {
    nextEl: HTMLElement | null;
    prevEl: HTMLElement | null;
  };
  on?: {
    init?: (instance: SwiperInstance) => void;
    slideChange?: (instance: SwiperInstance) => void;
    transitionEnd?: (instance: SwiperInstance) => void;
  };
}

declare class Swiper {
  constructor(element: HTMLElement, options: SwiperOptions);
  slides: HTMLElement[];
  activeIndex: number;
  update: () => void;
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
}

interface GSAP {
  to(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): GSAPTween;
  fromTo(
    target: string | Element | NodeList | Element[],
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>
  ): GSAPTween;
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
  killTweensOf(target: string | Element | NodeList | Element[]): void;
}

interface GSAPTween {
  delay(value: number): GSAPTween;
}

declare const gsap: GSAP;

// Store active slider instances
const activeDockSliders = new Map<HTMLElement, SwiperInstance>();

// Mobile/Tablet breakpoint - anything below desktop (991px and below)
const MOBILE_BREAKPOINT = 991;

/**
 * Check if we're on mobile (landscape or portrait)
 */
function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Inject specific CSS for dock swiper to handle tooltips and mobile layout issues
 */
function injectDockStyles(): void {
  const id = 'dock-custom-styles';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = `
    /* Base Tooltip Styles (Desktop) */
    [data-slider-dock] .nav-item__tooltip {
      font-size: 10px !important;
      min-height: 1.75rem !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      white-space: nowrap !important;
      padding: 0 12px !important;
    }

    @media screen and (max-width: ${MOBILE_BREAKPOINT}px) {
      /* Mobile Tooltip Styles */
      [data-slider-dock] .nav-item__tooltip {
        font-size: 10px !important;
        min-width: 140px !important;
        width: max-content !important;
      }

      [data-slider-dock].swiper {
        width: 100% !important;
        display: block !important;
        overflow: visible !important;
      }
      [data-slider-dock] .swiper-wrapper {
        display: flex !important;
        width: auto !important;
      }
      [data-slider-dock] .swiper-slide {
        width: 20% !important;
        flex-shrink: 0 !important;
        display: flex !important;
        justify-content: center !important;
        max-width: none !important;
        height: auto !important;
      }
      [data-slider-dock] .nav-item__link {
        width: 100% !important;
        max-width: 7em !important;
      }
      [data-slider-dock] .nav-item__tollitp-decor {
        width: 12px !important;
        height: 12px !important;
        flex-shrink: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Update scale for mobile slides
 */
function updateMobileScale(instance: SwiperInstance): void {
  instance.slides.forEach((slide, index) => {
    const link = slide.querySelector<HTMLElement>('.nav-item__link');
    const tooltip = slide.querySelector<HTMLElement>('.nav-item__tooltip');
    if (!link) return;

    link.style.transition = 'transform 0.4s ease';
    link.style.transformOrigin = 'center bottom';

    const isActive = index === instance.activeIndex;
    const isNeighbor = index === instance.activeIndex - 1 || index === instance.activeIndex + 1;

    if (isActive) {
      link.style.transform = 'scale(1.4)';
      slide.style.zIndex = '100';

      // Show tooltip for active slide
      if (tooltip) {
        gsap.to(tooltip, {
          opacity: 1,
          y: -55,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: true,
        });
      }
    } else if (isNeighbor) {
      link.style.transform = 'scale(1.1)';
      slide.style.zIndex = '50';

      // Hide tooltip for non-active
      if (tooltip) {
        gsap.to(tooltip, {
          opacity: 0,
          y: 0,
          scale: 0.8,
          duration: 0.2,
          overwrite: true,
        });
      }
    } else {
      link.style.transform = 'scale(0.8)';
      slide.style.zIndex = '1';

      // Hide tooltip for others
      if (tooltip) {
        gsap.to(tooltip, {
          opacity: 0,
          y: 0,
          scale: 0.8,
          duration: 0.2,
          overwrite: true,
        });
      }
    }
  });
}

/**
 * Initialize a single dock slider
 */
function initDockSlider(element: HTMLElement): void {
  if (activeDockSliders.has(element)) return; // Already initialized

  // Remove any hover classes and reset widths from nav items before Swiper initializes
  const navItems = element.querySelectorAll<HTMLElement>('.nav-item');
  navItems.forEach((item) => {
    item.classList.remove('hover');
    item.style.width = ''; // Reset width for Swiper to take over or auto-measure
    const link = item.querySelector<HTMLElement>('.nav-item__link');
    if (link) {
      link.style.transform = '';
      link.style.transition = '';
    }
  });

  const spaceAttr = element.getAttribute('data-dock-space');
  const spaceBetween = spaceAttr ? parseFloat(spaceAttr) : 16;

  const parent = element.parentElement;
  let nextEl = element.querySelector('.swiper-arrow.is-next') as HTMLElement | null;
  let prevEl = element.querySelector('.swiper-arrow.is-prev') as HTMLElement | null;

  if (!nextEl && parent) {
    nextEl = parent.querySelector('.swiper-arrow.is-next') as HTMLElement | null;
  }
  if (!prevEl && parent) {
    prevEl = parent.querySelector('.swiper-arrow.is-prev') as HTMLElement | null;
  }

  // Force container constraints to prevent astronomical width expansion
  element.style.width = '100%';
  element.style.overflow = 'hidden';

  // WRAP IN TIMEOUT: Webflow often needs a moment to settle layout
  requestAnimationFrame(() => {
    setTimeout(() => {
      // Final check – don't double init
      if (activeDockSliders.has(element)) return;

      const options: SwiperOptions = {
        slidesPerView: 'auto', // Use auto with the forced CSS widths
        slidesPerGroup: 1,
        spaceBetween: spaceBetween,
        loop: false,
        centeredSlides: true,
        freeMode: false,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        resizeObserver: true,
        updateOnWindowResize: true,
        navigation: {
          nextEl: nextEl,
          prevEl: prevEl,
        },
        on: {
          init: (swiper) => {
            updateMobileScale(swiper);
            // Re-check after a bit to snap into place
            setTimeout(() => swiper.update(), 100);
          },
          slideChange: (swiper) => updateMobileScale(swiper),
          transitionEnd: (swiper) => updateMobileScale(swiper),
        },
      };

      const instance = new Swiper(element, options);
      activeDockSliders.set(element, instance);
    }, 50);
  });
}

/**
 * Destroy a single dock slider
 */
function destroyDockSlider(element: HTMLElement): void {
  const instance = activeDockSliders.get(element);
  if (instance) {
    instance.destroy(true, true);
    activeDockSliders.delete(element);
  }
}

/**
 * Get all dock slider elements
 */
function getDockSliderElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-slider-dock]'));
}

/**
 * Handle all dock sliders based on current viewport
 */
function handleDockSliders(): void {
  const sliders = getDockSliderElements();
  const mobile = isMobile();

  sliders.forEach((slider) => {
    if (mobile) {
      initDockSlider(slider);
    } else {
      destroyDockSlider(slider);
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
 * Initialize hover effect for dock items
 * Only enlarges the hovered item's LINK
 * Slides the tooltip from the bottom
 */
function initDockHoverEffect(): void {
  const dockWrappers = document.querySelectorAll<HTMLElement>('[data-slider-dock]');

  dockWrappers.forEach((wrapper) => {
    const navItems = Array.from(wrapper.querySelectorAll<HTMLElement>('.nav-item'));
    if (navItems.length === 0) return;

    // Helper to apply scales
    const applyScales = (hoveredIndex: number) => {
      navItems.forEach((item, index) => {
        const link = item.querySelector<HTMLElement>('.nav-item__link');
        if (!link) return;

        // Ensure transition is set for smooth scaling
        link.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        link.style.transformOrigin = 'center bottom'; // Scale from center bottom

        if (index === hoveredIndex) {
          link.style.transform = 'scale(2)'; // Slightly bigger as requested
          item.style.zIndex = '100'; // Active item must be on top of everything
        } else if (index === hoveredIndex - 1 || index === hoveredIndex + 1) {
          link.style.transform = 'scale(1.25)';
          item.style.zIndex = '50'; // Neighbors below active but above others
        } else {
          link.style.transform = 'scale(1)';
          item.style.zIndex = '1';
        }
      });
    };

    // Helper to reset scales
    const resetScales = () => {
      navItems.forEach((item) => {
        const link = item.querySelector<HTMLElement>('.nav-item__link');
        if (link) {
          link.style.transform = 'scale(1)';
        }
        item.style.zIndex = '';
        item.classList.remove('hover');
        // Hide tooltip
        const tooltip = item.querySelector<HTMLElement>('.nav-item__tooltip');
        if (tooltip) {
          gsap.to(tooltip, { opacity: 0, y: 0, duration: 0.2, overwrite: true });
        }
      });
    };

    navItems.forEach((item, index) => {
      // Ensure relative positioning for tooltip context
      item.style.position = 'relative';

      // Ensure link is explicitly layered below the tooltip
      const link = item.querySelector<HTMLElement>('.nav-item__link');
      if (link) {
        link.style.position = 'relative';
        link.style.zIndex = '2'; // Base level for icon
      }

      // Setup Tooltip Initial State
      const tooltip = item.querySelector<HTMLElement>('.nav-item__tooltip');
      if (tooltip) {
        gsap.set(tooltip, {
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          xPercent: -50,
          marginBottom: '-20px',
          opacity: 0,
          pointerEvents: 'none',
          display: 'block',
        });
      }

      // Mouse Enter Item
      item.addEventListener('mouseenter', () => {
        if (isMobile()) return;

        applyScales(index);
        item.classList.add('hover');

        if (tooltip) {
          gsap.to(tooltip, {
            opacity: 1,
            y: -55,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
        }
      });

      // Mouse Leave Item
      item.addEventListener('mouseleave', () => {
        if (isMobile()) return;
        if (tooltip) {
          gsap.to(tooltip, {
            opacity: 0,
            y: 0,
            duration: 0.2,
            overwrite: true,
          });
        }
      });
    });

    // Mouse Leave Link List (Reset layout)
    const list = wrapper.querySelector('.nav-list') || wrapper;
    list.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      resetScales();
    });
  });
}

/**
 * Initialize dock sliders (only on mobile landscape and portrait)
 */
export function initDockSliders(): void {
  if (typeof Swiper === 'undefined') return;

  const sliders = getDockSliderElements();

  if (sliders.length === 0) return;

  // Ensure dock styles are present
  injectDockStyles();

  // Initial check
  handleDockSliders();

  // Handle resize with debounce
  const debouncedHandler = debounce(handleDockSliders, 150);
  window.addEventListener('resize', debouncedHandler);

  // Initialize dock hover effect (works on desktop/tablet only)
  initDockHoverEffect();
}
