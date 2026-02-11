/**
 * Dock Slider Component
 */

interface SwiperInstance {
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
  navigation?: {
    nextEl: HTMLElement | null;
    prevEl: HTMLElement | null;
  };
}

declare class Swiper {
  constructor(element: HTMLElement, options: SwiperOptions);
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

// Mobile breakpoint - only mobile phones (767px and below)
// Tablet (768-991px) and desktop behave the same: static dock with hover effects
const MOBILE_BREAKPOINT = 767;

/**
 * Check if we're on mobile (landscape or portrait)
 */
function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Initialize a single dock slider
 */
function initDockSlider(element: HTMLElement): void {
  if (activeDockSliders.has(element)) return; // Already initialized

  // Remove any hover classes from nav items before Swiper initializes
  // This prevents CSS transform conflicts with Swiper's calculations
  const navItems = element.querySelectorAll<HTMLElement>('.nav-item');
  navItems.forEach((item) => {
    item.classList.remove('hover');
    // Clean up inline styles from desktop interactions
    const link = item.querySelector<HTMLElement>('.nav-item__link');
    if (link) {
      link.style.transform = '';
      link.style.transition = '';
    }
  });

  // Use 'auto' to respect Webflow CSS widths (e.g., max-width: 6em)
  const slidesPerView = 'auto';

  // Read optional space between slides
  const spaceAttr = element.getAttribute('data-dock-space');
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

  const options: SwiperOptions = {
    slidesPerView: slidesPerView,
    slidesPerGroup: 1, // Advance one slide at a time
    spaceBetween: spaceBetween,
    loop: false,
    freeMode: false,
    watchOverflow: true,
    navigation: {
      nextEl: nextEl,
      prevEl: prevEl,
    },
  };

  const instance = new Swiper(element, options);
  activeDockSliders.set(element, instance);
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

  // Initial check
  handleDockSliders();

  // Handle resize with debounce
  const debouncedHandler = debounce(handleDockSliders, 150);
  window.addEventListener('resize', debouncedHandler);

  // Initialize dock hover effect (works on desktop/tablet only)
  initDockHoverEffect();
}
