/**
 * MobileNavScroll - Fixes mobile navigation scrolling on touch devices
 *
 * Problem: Webflow's `.w-nav-overlay` and `.w-nav-menu` don't scroll properly
 * on actual mobile devices (iOS Safari, Android Chrome) even though they work
 * when resizing a desktop browser window.
 *
 * Solution: Apply proper touch scrolling styles and handle touch events
 * to enable native-like scrolling on the navigation overlay.
 */

const TABLET_BREAKPOINT = 991;

class MobileNavScroll {
  private navOverlay: HTMLElement;
  private navMenu: HTMLElement | null = null;
  private isApplied = false;

  constructor(navOverlay: HTMLElement) {
    this.navOverlay = navOverlay;
    this.navMenu = navOverlay.querySelector('.w-nav-menu');

    this.init();
  }

  private init(): void {
    // Watch for menu open/close
    this.observeMenuState();

    // Apply styles on resize
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    const isMobile = window.innerWidth <= TABLET_BREAKPOINT;

    if (isMobile) {
      this.applyMobileScrollStyles();
    } else {
      this.removeMobileScrollStyles();
    }
  };

  private applyMobileScrollStyles(): void {
    if (this.isApplied) return;
    this.isApplied = true;

    // Style the overlay container
    this.navOverlay.style.overflowY = 'auto';
    this.navOverlay.style.overflowX = 'hidden';
    (this.navOverlay.style as unknown as Record<string, string>)['-webkit-overflow-scrolling'] =
      'touch'; // Enables momentum scrolling on iOS
    this.navOverlay.style.maxHeight = '100dvh'; // Dynamic viewport height for mobile

    // Style the nav menu
    if (this.navMenu) {
      this.navMenu.style.overflowY = 'auto';
      this.navMenu.style.overflowX = 'hidden';
      (this.navMenu.style as unknown as Record<string, string>)['-webkit-overflow-scrolling'] =
        'touch';
      this.navMenu.style.maxHeight = '100dvh';
      this.navMenu.style.paddingBottom = '100px'; // Extra padding for safe area at bottom
    }

    // Prevent body scroll when menu is open
    this.setupScrollLocking();
  }

  private removeMobileScrollStyles(): void {
    if (!this.isApplied) return;
    this.isApplied = false;

    // Reset overlay styles
    this.navOverlay.style.overflowY = '';
    this.navOverlay.style.overflowX = '';
    (this.navOverlay.style as unknown as Record<string, string>)['-webkit-overflow-scrolling'] = '';
    this.navOverlay.style.maxHeight = '';

    // Reset nav menu styles
    if (this.navMenu) {
      this.navMenu.style.overflowY = '';
      this.navMenu.style.overflowX = '';
      (this.navMenu.style as unknown as Record<string, string>)['-webkit-overflow-scrolling'] = '';
      this.navMenu.style.maxHeight = '';
      this.navMenu.style.paddingBottom = '';
    }
  }

  private setupScrollLocking(): void {
    // When menu is open, prevent background scroll but allow menu scroll
    const menuButton = document.querySelector('.w-nav-button');

    if (menuButton) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const isOpen = menuButton.classList.contains('w--open');
            this.handleMenuToggle(isOpen);
          }
        });
      });

      observer.observe(menuButton, { attributes: true });
    }
  }

  private handleMenuToggle(isOpen: boolean): void {
    if (isOpen && window.innerWidth <= TABLET_BREAKPOINT) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;

      // Force recalculate overlay height
      this.updateOverlayHeight();
    } else {
      // Restore body scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
  }

  private updateOverlayHeight(): void {
    // Use visualViewport for accurate mobile height
    const vh = window.visualViewport?.height || window.innerHeight;
    this.navOverlay.style.maxHeight = `${vh}px`;

    if (this.navMenu) {
      this.navMenu.style.maxHeight = `${vh}px`;
    }
  }

  private observeMenuState(): void {
    // Also observe the overlay display state
    const observer = new MutationObserver(() => {
      if (this.navOverlay.style.display === 'block') {
        if (window.innerWidth <= TABLET_BREAKPOINT) {
          this.applyMobileScrollStyles();
          this.updateOverlayHeight();
        }
      }
    });

    observer.observe(this.navOverlay, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Handle visualViewport resize (keyboard, address bar)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (window.innerWidth <= TABLET_BREAKPOINT) {
          this.updateOverlayHeight();
        }
      });
    }
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.removeMobileScrollStyles();
  }
}

export function initMobileNavScroll(): void {
  // Wait for Webflow to create the overlay
  const checkAndInit = () => {
    const navOverlays = document.querySelectorAll<HTMLElement>('.w-nav-overlay');

    navOverlays.forEach((overlay) => {
      // Only init once
      if (!overlay.dataset.mobileScrollInit) {
        overlay.dataset.mobileScrollInit = 'true';
        new MobileNavScroll(overlay);
      }
    });
  };

  // Init immediately
  checkAndInit();

  // Also check after a small delay in case Webflow creates it later
  setTimeout(checkAndInit, 500);
}

export { MobileNavScroll };
