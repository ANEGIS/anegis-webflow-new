/**
 * Pro Scroll Toggler + Child Logic (Button & Logo)
 * Features: Hysteresis (Anti-Flicker) & Cached Child Selectors
 * Desktop only (>991px) with resize handling
 */

// Desktop breakpoint
const DESKTOP_BREAKPOINT = 991;

// --- CONFIGURATION ---
const TARGET_SELECTOR = "[fs-scrolldisable-element='smart-nav']";
const BUTTON_WRAPPER_SELECTOR = '.button-wrapper';

const ACTIVE_CLASS = 'is-pinned';
const VARIANT_CLASS = 'w-variant-a4b72284-6321-8341-edca-223fdec43abe';

const THRESHOLD_ON = 50;
const THRESHOLD_OFF = 40;

// State
let isActive = false;
let hasClass = false;
let isTicking = false;

// Cached elements
let targetElement: Element | null = null;
let buttonWrapper: Element | null = null;

/**
 * Check if we're on desktop
 */
function isDesktop(): boolean {
  return window.innerWidth > DESKTOP_BREAKPOINT;
}

/**
 * Handle scroll and update classes
 */
function handleScroll(): void {
  if (!targetElement || !isActive) {
    isTicking = false;
    return;
  }

  const scrollY = window.scrollY || window.pageYOffset;

  // --- PINNED STATE (Scroll > 50) ---
  if (!hasClass && scrollY > THRESHOLD_ON) {
    targetElement.classList.add(ACTIVE_CLASS);
    if (buttonWrapper) buttonWrapper.classList.remove(VARIANT_CLASS);
    hasClass = true;
  }
  // --- UNPINNED STATE (Scroll < 40) ---
  else if (hasClass && scrollY < THRESHOLD_OFF) {
    targetElement.classList.remove(ACTIVE_CLASS);
    if (buttonWrapper) buttonWrapper.classList.add(VARIANT_CLASS);
    hasClass = false;
  }

  isTicking = false;
}

/**
 * Scroll event handler with RAF throttling
 */
function onScroll(): void {
  if (!isTicking && isActive) {
    window.requestAnimationFrame(handleScroll);
    isTicking = true;
  }
}

/**
 * Reset nav to default state (unpinned)
 */
function resetNavState(): void {
  if (targetElement) {
    targetElement.classList.remove(ACTIVE_CLASS);
  }
  if (buttonWrapper) {
    buttonWrapper.classList.add(VARIANT_CLASS);
  }
  hasClass = false;
}

/**
 * Handle resize - enable/disable based on viewport
 */
function handleResize(): void {
  const desktop = isDesktop();

  if (desktop && !isActive) {
    // Activate on desktop
    isActive = true;
    handleScroll(); // Check current scroll position
  } else if (!desktop && isActive) {
    // Deactivate on mobile/tablet
    isActive = false;
    resetNavState();
  }
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
 * Initialize SmartNav
 */
export function initSmartNav(): void {
  targetElement = document.querySelector(TARGET_SELECTOR);
  if (!targetElement) return;

  buttonWrapper = targetElement.querySelector(BUTTON_WRAPPER_SELECTOR);

  // Add scroll listener (always attached, but only acts when isActive)
  window.addEventListener('scroll', onScroll, { passive: true });

  // Add resize listener with debounce
  const debouncedResize = debounce(handleResize, 150);
  window.addEventListener('resize', debouncedResize);

  // Initial check
  handleResize();
}
