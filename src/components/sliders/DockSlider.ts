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
 * Only enlarges the hovered item (no sibling effects)
 * Only active on desktop/tablet where dock is static (not a swiper)
 */
function initDockHoverEffect(): void {
  const navItems = document.querySelectorAll<HTMLElement>('.nav-item');

  console.log('DockSlider: initDockHoverEffect called');
  console.log('DockSlider: Found', navItems.length, 'nav items');

  if (navItems.length === 0) return;

  // Simple hover effect - only toggle class on the hovered item
  // BUT only if we're on desktop (> 991px) where Swiper is NOT active
  navItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      // Only apply hover effect on desktop/tablet (where Swiper is NOT active)
      if (!isMobile()) {
        console.log(`DockSlider: Hover on item ${index} (desktop mode)`);
        item.classList.add('hover');
      }
    });

    item.addEventListener('mouseleave', () => {
      if (!isMobile()) {
        console.log(`DockSlider: Leave item ${index} (desktop mode)`);
        item.classList.remove('hover');
      }
    });
  });

  console.log('DockSlider: Hover effect initialized on', navItems.length, 'items');
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
