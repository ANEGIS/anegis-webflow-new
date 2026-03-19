export class TabsAutomatic {
  tablistNode: HTMLElement;
  tabs: HTMLElement[] = [];
  firstTab: HTMLElement | null = null;
  lastTab: HTMLElement | null = null;
  tabpanels: HTMLElement[] = [];
  private pendingTimeouts: number[] = [];

  constructor(groupNode: HTMLElement) {
    this.tablistNode = groupNode;
    const orientation = this.tablistNode.getAttribute('data-orientation') || 'horizontal';
    this.tablistNode.setAttribute('aria-orientation', orientation);
    this.tabs = Array.from(this.tablistNode.querySelectorAll('[role=tab]'));

    this.tabs.forEach((tab) => {
      const controls = tab.getAttribute('aria-controls');
      if (!controls) return;

      const tabpanel = document.getElementById(controls);
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;

      if (tabpanel) {
        tabpanel.setAttribute('role', 'tabpanel');
        tabpanel.setAttribute('aria-labelledby', tab.id);
        tabpanel.removeAttribute('tabindex');
        this.tabpanels.push(tabpanel);
      }

      tab.addEventListener('keydown', this.onKeydown.bind(this));
      tab.addEventListener('click', this.onClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tab;
      }
      this.lastTab = tab;
    });

    const initialTab =
      this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || this.firstTab;

    if (initialTab) {
      if (window.innerWidth <= 991 && this.tablistNode.closest('.tabs_component')) {
        // Fix for mobile opacity issue: directly set active state without animation
        this.setInitialMobileTab(initialTab);
      } else {
        this.setSelectedTab(initialTab, false);
      }
    }

    // Set initial height for tabs content (disabled)
    // this.setTabsContentHeight();
  }

  /**
   * Set the tabs content min-height to the tallest tab panel
   */
  setTabsContentHeight() {
    const tabsComponent = this.tablistNode.closest('.tabs_component');
    if (!tabsComponent) return;

    const contentContainer = tabsComponent.querySelector('.tabs_component-content') as HTMLElement;
    if (!contentContainer) return;

    // Only run on desktop
    if (window.innerWidth <= 991) {
      contentContainer.style.minHeight = '';
      return;
    }

    const panels = contentContainer.querySelectorAll(':scope > *');
    if (panels.length === 0) return;

    // Measure all panels including hidden ones to find the tallest
    let maxHeight = 0;
    panels.forEach((panel) => {
      const p = panel as HTMLElement;
      const isHidden = p.hasAttribute('hidden');

      if (isHidden) {
        p.style.visibility = 'hidden';
        p.style.display = 'block';
        p.style.position = 'absolute';
        p.removeAttribute('hidden');
      }

      maxHeight = Math.max(maxHeight, p.offsetHeight);

      if (isHidden) {
        p.setAttribute('hidden', 'true');
        p.style.display = '';
        p.style.position = '';
        p.style.visibility = '';
      }
    });

    contentContainer.style.minHeight = maxHeight + 'px';
  }

  setInitialMobileTab(currentTab: HTMLElement) {
    const controls = currentTab.getAttribute('aria-controls');
    const tabpanel = controls ? document.getElementById(controls) : null;

    currentTab.setAttribute('aria-selected', 'true');
    currentTab.tabIndex = 0;
    currentTab.classList.add('is-active-tab');

    if (tabpanel) {
      tabpanel.classList.add('is-active-tab');
      tabpanel.removeAttribute('hidden');
      tabpanel.style.opacity = '1'; // Ensure it's fully visible
      tabpanel.removeAttribute('style'); // Then remove clear style to avoid conflict with CSS
    }
  }

  setSelectedTab(currentTab: HTMLElement, setFocus: boolean = true) {
    // Cancel any pending transition timeouts from previous tab switches
    this.pendingTimeouts.forEach((id) => clearTimeout(id));
    this.pendingTimeouts = [];

    // Check if tabs are within .tabs_component wrapper
    const tabsComponent = this.tablistNode.closest('.tabs_component');
    const useTransition = tabsComponent !== null;

    // Immediately deactivate all other tabs and panels
    this.tabs.forEach((tab) => {
      if (currentTab === tab) return;

      const loopControls = tab.getAttribute('aria-controls');
      const loopTabpanel = loopControls ? document.getElementById(loopControls) : null;

      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = -1;
      tab.classList.remove('is-active-tab');
      if (loopTabpanel) {
        loopTabpanel.classList.remove('is-active-tab');
        loopTabpanel.setAttribute('hidden', 'true');
        loopTabpanel.removeAttribute('style');
      }
    });

    // Handle incoming tab
    const controls = currentTab.getAttribute('aria-controls');
    const tabpanel = controls ? document.getElementById(controls) : null;

    currentTab.setAttribute('aria-selected', 'true');
    currentTab.tabIndex = 0;
    currentTab.classList.add('is-active-tab');

    if (tabpanel) {
      tabpanel.classList.add('is-active-tab');
      tabpanel.removeAttribute('hidden');

      if (useTransition) {
        // Fade in new panel
        tabpanel.style.opacity = '0';
        tabpanel.style.transition = 'opacity 0.2s ease-in-out';

        // Trigger reflow to ensure transition works
        void tabpanel.offsetWidth;

        this.pendingTimeouts.push(
          window.setTimeout(() => {
            tabpanel.style.opacity = '1';
          }, 10)
        );

        // Clean up inline styles after transition
        this.pendingTimeouts.push(
          window.setTimeout(() => {
            tabpanel.removeAttribute('style');
          }, 250)
        );
      } else {
        tabpanel.removeAttribute('style');
      }
    }

    if (setFocus) {
      currentTab.focus({ preventScroll: true });
    }
  }

  setSelectedToPreviousTab(currentTab: HTMLElement) {
    if (currentTab === this.firstTab && this.lastTab) {
      this.setSelectedTab(this.lastTab);
    } else {
      const index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index - 1]);
    }
  }

  setSelectedToNextTab(currentTab: HTMLElement) {
    if (currentTab === this.lastTab && this.firstTab) {
      this.setSelectedTab(this.firstTab);
    } else {
      const index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index + 1]);
    }
  }

  onKeydown(event: KeyboardEvent) {
    const tgt = event.currentTarget as HTMLElement;
    let flag = false;
    const orientation = this.tablistNode.getAttribute('aria-orientation') || 'horizontal';

    switch (event.key) {
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          this.setSelectedToPreviousTab(tgt);
          flag = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          this.setSelectedToNextTab(tgt);
          flag = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          this.setSelectedToPreviousTab(tgt);
          flag = true;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          this.setSelectedToNextTab(tgt);
          flag = true;
        }
        break;
      case 'Home':
        if (this.firstTab) {
          this.setSelectedTab(this.firstTab);
          flag = true;
        }
        break;
      case 'End':
        if (this.lastTab) {
          this.setSelectedTab(this.lastTab);
          flag = true;
        }
        break;
      case 'Enter':
      case ' ':
        this.setSelectedTab(tgt);
        flag = true;
        break;
      default:
        break;
    }
    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event: MouseEvent) {
    this.setSelectedTab(event.currentTarget as HTMLElement);
  }
}

export function initTabLists() {
  const tabContainers = document.querySelectorAll('[data-module="tabs"]');
  tabContainers.forEach((container) => {
    const tablist = container.querySelector('[role="tablist"]');
    if (tablist instanceof HTMLElement) {
      if (container.hasAttribute('data-orientation') && !tablist.hasAttribute('data-orientation')) {
        const orientation = container.getAttribute('data-orientation');
        if (orientation) tablist.setAttribute('data-orientation', orientation);
      }
      new TabsAutomatic(tablist);
    }
  });

  const allStandaloneTablists = document.querySelectorAll('[role="tablist"]');
  allStandaloneTablists.forEach((tablist) => {
    if (tablist instanceof HTMLElement && !tablist.closest('[data-module="tabs"]')) {
      new TabsAutomatic(tablist);
    }
  });
}

/**
 * On tablet and below (≤991px), change .tabs_component-menu tab links
 * to navigate to /branze/{data-w-tab value} instead of switching tabs.
 * On desktop, restore the original Webflow hrefs.
 */
export function initTabsMenuLinks() {
  const TABLET_BREAKPOINT = 991;
  const menus = document.querySelectorAll('.tabs_component-menu');
  if (menus.length === 0) return;

  // Store original hrefs so we can restore them on desktop
  const originalHrefs = new Map<HTMLAnchorElement, string>();

  menus.forEach((menu) => {
    const links = menu.querySelectorAll<HTMLAnchorElement>('a[data-w-tab]');
    links.forEach((link) => {
      originalHrefs.set(link, link.getAttribute('href') || '');
    });
  });

  function updateHrefs() {
    const isMobile = window.innerWidth <= TABLET_BREAKPOINT;

    originalHrefs.forEach((originalHref, link) => {
      if (isMobile) {
        const tabValue = link.getAttribute('data-w-tab');
        if (tabValue) {
          link.setAttribute('href', `/branze/${tabValue}`);
        }
      } else {
        link.setAttribute('href', originalHref);
      }
    });
  }

  // Run on init
  updateHrefs();

  // Re-run on resize
  window.addEventListener('resize', updateHrefs);
}
