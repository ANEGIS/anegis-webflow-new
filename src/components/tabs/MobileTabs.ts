/**
 * MobileTabs - Restructures Webflow tabs for mobile/tablet
 *
 * On tablet and below, transforms:
 *   Menu: [Tab1] [Tab2] [Tab3]
 *   Content: [Content1] [Content2] [Content3]
 *
 * Into accordion structure:
 *   [Tab1]
 *   [Content1]
 *   [Tab2]
 *   [Content2]
 *   [Tab3]
 *   [Content3]
 *
 * Usage: Add `data-tabs-mobile` attribute to the `.w-tabs` container
 */

interface TabPair {
  pill: HTMLElement;
  pane: HTMLElement;
  tabName: string;
}

const TABLET_BREAKPOINT = 991;
const MOBILE_CLASS = 'is-mobile-tabs';
const WRAPPER_CLASS = 'mobile-tabs-wrapper';

class MobileTabs {
  private container: HTMLElement;
  private menu: HTMLElement | null;
  private content: HTMLElement | null;
  private tabPairs: TabPair[] = [];
  private isMobileLayout = false;
  private originalContentParent: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.menu = container.querySelector('.w-tab-menu');
    this.content = container.querySelector('.w-tab-content');

    if (!this.menu || !this.content) {
      console.error('[MobileTabs] Missing .w-tab-menu or .w-tab-content');
      return;
    }

    this.originalContentParent = this.content.parentElement;
    this.collectTabPairs();
    this.init();
  }

  private collectTabPairs(): void {
    if (!this.menu || !this.content) return;

    const pills = Array.from(this.menu.querySelectorAll<HTMLElement>('[data-w-tab]'));
    const panes = Array.from(this.content.querySelectorAll<HTMLElement>('[data-w-tab]'));

    pills.forEach((pill) => {
      const tabName = pill.getAttribute('data-w-tab')?.trim();
      if (!tabName) return;

      const matchingPane = panes.find(
        (pane) => pane.getAttribute('data-w-tab')?.trim() === tabName
      );

      if (matchingPane) {
        this.tabPairs.push({ pill, pane: matchingPane, tabName });
      }
    });
  }

  private init(): void {
    // Check initial viewport
    this.handleResize();

    // Listen for resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize = (): void => {
    const isMobile = window.innerWidth <= TABLET_BREAKPOINT;

    if (isMobile && !this.isMobileLayout) {
      this.applyMobileLayout();
    } else if (!isMobile && this.isMobileLayout) {
      this.restoreDesktopLayout();
    }
  };

  private applyMobileLayout(): void {
    if (!this.menu || !this.content) return;

    this.isMobileLayout = true;
    this.container.classList.add(MOBILE_CLASS);

    // Hide the original content container
    this.content.style.display = 'none';

    // For each tab pair, insert the pane right after the pill
    this.tabPairs.forEach(({ pill, pane }, index) => {
      // Create a wrapper div to hold the pane in mobile layout
      const wrapper = document.createElement('div');
      wrapper.className = WRAPPER_CLASS;
      wrapper.appendChild(pane.cloneNode(true) as HTMLElement);

      // Get the cloned pane
      const clonedPane = wrapper.firstElementChild as HTMLElement;

      // Behavior update: Only keep the LAST one opened and disable switching
      const isLast = index === this.tabPairs.length - 1;

      if (isLast) {
        clonedPane.removeAttribute('hidden');
        clonedPane.style.display = '';
        wrapper.classList.add('is-open');
      } else {
        clonedPane.setAttribute('hidden', 'true');
        clonedPane.style.display = 'none';
        wrapper.classList.remove('is-open');
      }

      // Insert after the pill
      pill.insertAdjacentElement('afterend', wrapper);

      // FORCE DISABLE WEBFLOW NATIVE TAB SWITCHING
      // We stop propagation in the capture phase so Webflow's native scripts never see the click,
      // but we do NOT call preventDefault so that <a> links still work.
      pill.addEventListener('click', this.preventWebflowClick, { capture: true });
    });
  }

  private preventWebflowClick = (e: Event): void => {
    // Stop other listeners (Webflow's tab script) from seeing this click
    e.stopImmediatePropagation();
    // Do NOT call preventDefault() - we want <a> links to still navigate
  };

  private handleMobileTabClick = (e: Event): void => {
    const clickedPill = e.currentTarget as HTMLElement;
    const clickedTabName = clickedPill.getAttribute('data-w-tab')?.trim();

    // Find all mobile wrappers and update their visibility
    this.tabPairs.forEach(({ pill, tabName }) => {
      const wrapper = pill.nextElementSibling as HTMLElement;
      if (!wrapper || !wrapper.classList.contains(WRAPPER_CLASS)) return;

      const pane = wrapper.firstElementChild as HTMLElement;
      if (!pane) return;

      if (tabName === clickedTabName) {
        // Show this content
        pane.removeAttribute('hidden');
        pane.style.display = '';
        wrapper.classList.add('is-open');
      } else {
        // Hide other content
        pane.setAttribute('hidden', 'true');
        pane.style.display = 'none';
        wrapper.classList.remove('is-open');
      }
    });
  };

  private restoreDesktopLayout(): void {
    if (!this.menu || !this.content) return;

    this.isMobileLayout = false;
    this.container.classList.remove(MOBILE_CLASS);

    // Remove click listeners and reset styles
    this.tabPairs.forEach(({ pill }) => {
      pill.removeEventListener('click', this.handleMobileTabClick);
      pill.removeEventListener('click', this.preventWebflowClick, { capture: true });
      // Reset pointer events if they were ever set
      pill.style.pointerEvents = '';
    });

    // Remove all mobile wrappers
    const wrappers = this.menu.querySelectorAll(`.${WRAPPER_CLASS}`);
    wrappers.forEach((wrapper) => wrapper.remove());

    // Show the original content container
    this.content.style.display = '';
  }

  destroy(): void {
    this.restoreDesktopLayout();
    window.removeEventListener('resize', this.handleResize);
  }
}

export function initMobileTabs(): void {
  const containers = document.querySelectorAll<HTMLElement>('[data-tabs-mobile]');

  containers.forEach((container) => {
    // Check if it's a Webflow tabs component
    if (container.classList.contains('w-tabs') || container.querySelector('.w-tabs')) {
      const tabsContainer = container.classList.contains('w-tabs')
        ? container
        : container.querySelector<HTMLElement>('.w-tabs');

      if (tabsContainer) {
        new MobileTabs(tabsContainer);
      }
    }
  });
}

export { MobileTabs };
