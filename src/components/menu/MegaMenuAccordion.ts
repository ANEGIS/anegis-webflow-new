/**
 * MegaMenuAccordion - Converts tabs within [data-big-menu] to accordion dropdowns on tablet and smaller
 *
 * On tablet (≤991px), transforms the mega menu tabs structure:
 *
 * FROM (desktop):
 *   [TabList Container]
 *     [Tab: Obszary] [Tab: Rozwiązania] [Tab: Usługi] [Tab: Branże]
 *   [Content Container]
 *     [Panel: Obszary] [Panel: Rozwiązania] [Panel: Usługi] [Panel: Branże]
 *
 * TO (mobile accordion):
 *   [Tab: Obszary] ▼
 *   [Panel: Obszary] (dropdown content)
 *   [Tab: Rozwiązania] ▼
 *   [Panel: Rozwiązania] (hidden)
 *   ...
 *
 * Each tab button becomes a dropdown trigger, and its respective panel shows directly underneath.
 * This is achieved via DOM manipulation WITHOUT modifying the original HTML structure in Webflow.
 */

const TABLET_BREAKPOINT = 991;

interface TabMapping {
  button: HTMLElement;
  panel: HTMLElement;
  controlsId: string;
}

class MegaMenuAccordion {
  private bigMenu: HTMLElement;
  private tabsModule: HTMLElement | null = null;
  private tablistContainer: HTMLElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private tabMappings: TabMapping[] = [];
  private isMobileLayout = false;
  private originalButtonsWrapper: HTMLElement | null = null;
  private accordionContainer: HTMLElement | null = null;
  private dropdownToggle: HTMLElement | null = null;
  private dropdownList: HTMLElement | null = null;
  private navMobileHeader: HTMLElement | null = null;

  // Store original parent references for restoration
  private originalStructure: {
    buttonsWrapper: HTMLElement | null;
    contentWrapper: HTMLElement | null;
    buttonsParent: HTMLElement | null;
    contentParent: HTMLElement | null;
    buttonsNextSibling: Node | null;
    contentNextSibling: Node | null;
  } = {
    buttonsWrapper: null,
    contentWrapper: null,
    buttonsParent: null,
    contentParent: null,
    buttonsNextSibling: null,
    contentNextSibling: null,
  };

  constructor(bigMenu: HTMLElement) {
    this.bigMenu = bigMenu;
    this.tabsModule = bigMenu.querySelector('[data-module="tabs"]');

    if (!this.tabsModule) {
      console.error('[MegaMenuAccordion] No [data-module="tabs"] found inside [data-big-menu]');
      return;
    }

    // Get the tablist and content containers
    this.tablistContainer = this.tabsModule.querySelector('[role="tablist"]');
    this.contentContainer = this.tabsModule.querySelector('.tabs_content-wrapper');

    if (!this.tablistContainer || !this.contentContainer) {
      console.error('[MegaMenuAccordion] Missing tablist or content container');
      return;
    }

    // Store original structure references
    this.originalButtonsWrapper = this.tablistContainer.closest('.tabs_buttons-wrapper');
    this.originalStructure = {
      buttonsWrapper: this.originalButtonsWrapper,
      contentWrapper: this.contentContainer,
      buttonsParent: this.originalButtonsWrapper?.parentElement || null,
      contentParent: this.contentContainer.parentElement,
      buttonsNextSibling: this.originalButtonsWrapper?.nextSibling || null,
      contentNextSibling: this.contentContainer.nextSibling,
    };

    // Build the tab-to-panel mappings
    this.buildTabMappings();

    // Get dropdown toggle and list for mobile manipulation
    this.dropdownToggle = bigMenu.querySelector('.w-dropdown-toggle');
    this.dropdownList = bigMenu.querySelector('.w-dropdown-list');
    this.navMobileHeader = bigMenu.querySelector('.nav_mobile-header');

    this.init();
  }

  private buildTabMappings(): void {
    if (!this.tablistContainer) return;

    const buttons = Array.from(this.tablistContainer.querySelectorAll<HTMLElement>('[role="tab"]'));

    buttons.forEach((button) => {
      const controlsId = button.getAttribute('aria-controls');
      if (!controlsId) return;

      const panel = document.getElementById(controlsId);
      if (!panel) return;

      this.tabMappings.push({
        button,
        panel,
        controlsId,
      });
    });
  }

  private init(): void {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
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
    if (!this.tabsModule || this.tabMappings.length === 0) return;

    this.isMobileLayout = true;
    this.bigMenu.classList.add('is-mega-menu-accordion');

    // Hide the "Co robimy" toggle and show the dropdown list directly
    if (this.dropdownToggle) {
      this.dropdownToggle.style.display = 'none';
    }
    if (this.navMobileHeader) {
      this.navMobileHeader.style.display = 'none';
    }
    if (this.dropdownList) {
      this.dropdownList.classList.add('w--open');
      this.dropdownList.style.display = 'block';
      this.dropdownList.style.backgroundColor = 'transparent';
    }

    // Create accordion container
    this.accordionContainer = document.createElement('div');
    this.accordionContainer.className = 'mega-menu-accordion';
    this.accordionContainer.setAttribute('data-mega-accordion', '');

    // Build accordion items: button + panel pairs
    this.tabMappings.forEach(({ button, panel }) => {
      // Create accordion item wrapper
      const accordionItem = document.createElement('div');
      accordionItem.className = 'mega-menu-accordion_item';
      accordionItem.setAttribute('data-accordion-item', '');

      // Clone the button to create the accordion trigger
      const triggerWrapper = document.createElement('div');
      triggerWrapper.className = 'mega-menu-accordion_trigger';

      // Re-use the original button styling but wrap it
      const buttonClone = button.cloneNode(true) as HTMLElement;
      buttonClone.classList.add('mega-menu-accordion_button');
      buttonClone.setAttribute('data-accordion-trigger', '');
      buttonClone.setAttribute('aria-expanded', 'false');

      // Set default icon rotation (-90deg for collapsed state)
      const icon = buttonClone.querySelector<HTMLElement>('.icon-embed-xxsmall');
      if (icon) {
        icon.style.transition = 'transform 0.3s ease';
        icon.style.transform = 'rotate(-90deg)';
      }

      triggerWrapper.appendChild(buttonClone);
      accordionItem.appendChild(triggerWrapper);

      // Clone the panel for accordion content
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'mega-menu-accordion_content';
      contentWrapper.setAttribute('data-accordion-content', '');
      contentWrapper.style.display = 'none';
      contentWrapper.style.overflow = 'hidden';
      contentWrapper.style.maxHeight = '0';
      contentWrapper.style.transition = 'max-height 0.3s ease-out';

      const panelClone = panel.cloneNode(true) as HTMLElement;
      panelClone.classList.add('mega-menu-accordion_panel');
      panelClone.removeAttribute('hidden');
      panelClone.removeAttribute('style');
      // Override background to match dark navbar theme
      panelClone.style.backgroundColor = 'transparent';

      contentWrapper.appendChild(panelClone);
      accordionItem.appendChild(contentWrapper);

      // Add click handler
      triggerWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleAccordionItem(accordionItem, buttonClone, contentWrapper);
      });

      this.accordionContainer!.appendChild(accordionItem);
    });

    // Hide original structure
    if (this.originalStructure.buttonsWrapper) {
      this.originalStructure.buttonsWrapper.style.display = 'none';
    }
    if (this.originalStructure.contentWrapper) {
      this.originalStructure.contentWrapper.style.display = 'none';
    }

    // Insert accordion into the tabs module
    this.tabsModule.appendChild(this.accordionContainer);
  }

  private toggleAccordionItem(item: HTMLElement, button: HTMLElement, content: HTMLElement): void {
    const isOpen = item.classList.contains('is-open');

    if (isOpen) {
      this.closeAccordionItem(item, button, content);
    } else {
      // Close all other items first (single accordion mode)
      this.closeAllAccordionItems();
      this.openAccordionItem(item, button, content);
    }
  }

  private openAccordionItem(item: HTMLElement, button: HTMLElement, content: HTMLElement): void {
    item.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');

    // Rotate icon to open state (-270deg)
    const icon = button.querySelector<HTMLElement>('.icon-embed-xxsmall');
    if (icon) {
      icon.style.transform = 'rotate(-270deg)';
    }

    // Animate open
    content.style.display = 'block';
    const { scrollHeight } = content;
    content.style.maxHeight = `${scrollHeight}px`;

    // After animation, allow content to grow if needed
    setTimeout(() => {
      if (item.classList.contains('is-open')) {
        content.style.maxHeight = 'none';
      }
    }, 300);
  }

  private closeAccordionItem(item: HTMLElement, button: HTMLElement, content: HTMLElement): void {
    item.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');

    // Rotate icon back to closed state (-90deg)
    const icon = button.querySelector<HTMLElement>('.icon-embed-xxsmall');
    if (icon) {
      icon.style.transform = 'rotate(-90deg)';
    }

    // Animate close
    content.style.maxHeight = `${content.scrollHeight}px`;
    // Force reflow
    void content.offsetHeight;
    content.style.maxHeight = '0';

    setTimeout(() => {
      if (!item.classList.contains('is-open')) {
        content.style.display = 'none';
      }
    }, 300);
  }

  private closeAllAccordionItems(): void {
    if (!this.accordionContainer) return;

    const openItems = this.accordionContainer.querySelectorAll('.mega-menu-accordion_item.is-open');
    openItems.forEach((item) => {
      const button = item.querySelector<HTMLElement>('[data-accordion-trigger]');
      const content = item.querySelector<HTMLElement>('[data-accordion-content]');
      if (button && content) {
        this.closeAccordionItem(item as HTMLElement, button, content);
      }
    });
  }

  private restoreDesktopLayout(): void {
    this.isMobileLayout = false;
    this.bigMenu.classList.remove('is-mega-menu-accordion');

    // Remove accordion container
    if (this.accordionContainer) {
      this.accordionContainer.remove();
      this.accordionContainer = null;
    }

    // Restore original structure visibility
    if (this.originalStructure.buttonsWrapper) {
      this.originalStructure.buttonsWrapper.style.display = '';
    }
    if (this.originalStructure.contentWrapper) {
      this.originalStructure.contentWrapper.style.display = '';
    }

    // Restore the "Co robimy" toggle and reset dropdown list
    if (this.dropdownToggle) {
      this.dropdownToggle.style.display = '';
    }
    if (this.navMobileHeader) {
      this.navMobileHeader.style.display = '';
    }
    if (this.dropdownList) {
      this.dropdownList.classList.remove('w--open');
      this.dropdownList.style.display = '';
      this.dropdownList.style.backgroundColor = '';
    }
  }

  destroy(): void {
    this.restoreDesktopLayout();
    window.removeEventListener('resize', this.handleResize);
  }
}

export function initMegaMenuAccordion(): void {
  const bigMenus = document.querySelectorAll<HTMLElement>('[data-big-menu]');

  bigMenus.forEach((bigMenu) => {
    new MegaMenuAccordion(bigMenu);
  });
}

export { MegaMenuAccordion };
