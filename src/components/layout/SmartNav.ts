/**
 * Pro Scroll Toggler + Child Logic (Button & Logo)
 * Features: Hysteresis (Anti-Flicker) & Cached Child Selectors
 */
export function initSmartNav() {
  // --- CONFIGURATION ---
  const TARGET_SELECTOR = "[fs-scrolldisable-element='smart-nav']";
  const BUTTON_WRAPPER_SELECTOR = '.button-wrapper';
  // const LOGO_SELECTOR = ".nav_logo-link"; // New selector

  const ACTIVE_CLASS = 'is-pinned';
  const VARIANT_CLASS = 'w-variant-a4b72284-6321-8341-edca-223fdec43abe';

  const THRESHOLD_ON = 50;
  const THRESHOLD_OFF = 40;

  // --- SETUP ---
  const targetElement = document.querySelector(TARGET_SELECTOR);
  if (!targetElement) return;

  // Cache children elements so we don't search for them 60x per second
  const buttonWrapper = targetElement.querySelector(BUTTON_WRAPPER_SELECTOR);
  // const logoLink = targetElement.querySelector(LOGO_SELECTOR);

  let isTicking = false;
  let hasClass = false;

  const handleScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;

    // --- PINNED STATE (Scroll > 50) ---
    if (!hasClass && scrollY > THRESHOLD_ON) {
      // 1. Main Nav: Add pinned class
      targetElement.classList.add(ACTIVE_CLASS);

      // 2. Logo: Add pinned class
      // if (logoLink) logoLink.classList.add(ACTIVE_CLASS);

      // 3. Button: REMOVE variant class
      if (buttonWrapper) buttonWrapper.classList.remove(VARIANT_CLASS);

      hasClass = true;
    }
    // --- UNPINNED STATE (Scroll < 40) ---
    else if (hasClass && scrollY < THRESHOLD_OFF) {
      // 1. Main Nav: Remove pinned class
      targetElement.classList.remove(ACTIVE_CLASS);

      // 2. Logo: Remove pinned class
      // if (logoLink) logoLink.classList.remove(ACTIVE_CLASS);

      // 3. Button: ADD variant class back
      if (buttonWrapper) buttonWrapper.classList.add(VARIANT_CLASS);

      hasClass = false;
    }

    isTicking = false;
  };

  // --- EVENT LISTENERS ---
  window.addEventListener(
    'scroll',
    () => {
      if (!isTicking) {
        window.requestAnimationFrame(handleScroll);
        isTicking = true;
      }
    },
    { passive: true }
  );

  // Initial check
  handleScroll();
}
