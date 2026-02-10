/**
 * NavAccessibility - Keyboard Navigation for Webflow Navbar
 *
 * Provides full keyboard accessibility for the navigation bar:
 * - TAB: Navigate through menu items
 * - ENTER:
 *   - If dropdown is closed: Open the dropdown
 *   - If dropdown is open: Navigate to the link (if exists) or close dropdown
 * - ESCAPE: Close any open dropdown
 * - Arrow Keys: Navigate within dropdowns (for mega menus with tabs)
 */

export class NavAccessibility {
  private nav: HTMLElement | null = null;
  private dropdowns: NodeListOf<HTMLElement> | null = null;
  private currentOpenDropdown: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the accessibility features
   */
  private init(): void {
    this.nav = document.querySelector('.nav');
    if (!this.nav) {
      return;
    }

    this.dropdowns = this.nav.querySelectorAll('[data-delay]');
    this.setupKeyboardNavigation();
  }

  /**
   * Setup keyboard navigation event listeners
   */
  private setupKeyboardNavigation(): void {
    if (!this.dropdowns) return;

    this.dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector('.w-dropdown-toggle') as HTMLElement;
      const dropdownList = dropdown.querySelector('.w-dropdown-list') as HTMLElement;

      if (!toggle) return;

      // Initialize: hide dropdown content from tab order when closed
      if (dropdownList) {
        this.setDropdownTabIndex(dropdownList, false);
      }

      // Handle keyboard events on dropdown toggle
      toggle.addEventListener('keydown', (e: KeyboardEvent) => {
        this.handleDropdownToggleKeydown(e, dropdown, toggle, dropdownList);
      });

      // Handle click events to track open state
      toggle.addEventListener('click', () => {
        this.handleDropdownClick(dropdown, toggle);
      });

      // Handle focus trap when navigating inside dropdown
      if (dropdownList) {
        this.setupDropdownFocusTrap(dropdown, dropdownList);
      }
    });

    // Global escape key handler
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e: MouseEvent) => {
      if (this.currentOpenDropdown && !this.currentOpenDropdown.contains(e.target as Node)) {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * Handle keydown events on dropdown toggle
   */
  private handleDropdownToggleKeydown(
    e: KeyboardEvent,
    dropdown: HTMLElement,
    toggle: HTMLElement,
    dropdownList: HTMLElement | null
  ): void {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    switch (e.key) {
      case 'Enter':
      case ' ': // Spacebar
        e.preventDefault();

        if (!isExpanded) {
          // Dropdown is closed - open it
          this.openDropdown(dropdown, toggle, dropdownList);
        } else {
          // Dropdown is open
          // Check if the toggle itself has a link
          const link = toggle.getAttribute('href');
          if (link && link !== '#') {
            // Navigate to the link
            window.location.href = link;
          } else {
            // Close the dropdown
            this.closeDropdown(dropdown, toggle, dropdownList);
          }
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isExpanded) {
          // Open dropdown and focus first item
          this.openDropdown(dropdown, toggle, dropdownList);
          setTimeout(() => {
            this.focusFirstItem(dropdownList);
          }, 100);
        } else {
          // Focus first item if already open
          this.focusFirstItem(dropdownList);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isExpanded) {
          // Focus last item
          this.focusLastItem(dropdownList);
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (isExpanded) {
          this.closeDropdown(dropdown, toggle, dropdownList);
          toggle.focus();
        }
        break;

      case 'Tab':
        // Allow natural tab behavior, but close dropdown if tabbing away
        if (isExpanded && !e.shiftKey) {
          // Check if we're tabbing to next top-level item
          setTimeout(() => {
            if (dropdownList && !dropdownList.contains(document.activeElement)) {
              this.closeDropdown(dropdown, toggle, dropdownList);
            }
          }, 0);
        }
        break;
    }
  }

  /**
   * Handle dropdown click (non-keyboard)
   */
  private handleDropdownClick(dropdown: HTMLElement, toggle: HTMLElement): void {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      this.closeAllDropdowns();
      this.currentOpenDropdown = dropdown;
    } else {
      this.currentOpenDropdown = null;
    }
  }

  /**
   * Open a dropdown
   */
  private openDropdown(
    dropdown: HTMLElement,
    toggle: HTMLElement,
    dropdownList: HTMLElement | null
  ): void {
    // Close any other open dropdowns first
    this.closeAllDropdowns();

    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('w--open');

    if (dropdownList) {
      dropdownList.classList.add('w--open');
      dropdownList.removeAttribute('style'); // Remove display:none if present
      this.setDropdownTabIndex(dropdownList, true); // Make content focusable
    }

    this.currentOpenDropdown = dropdown;
  }

  /**
   * Close a specific dropdown
   */
  private closeDropdown(
    dropdown: HTMLElement,
    toggle: HTMLElement,
    dropdownList: HTMLElement | null
  ): void {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('w--open');

    if (dropdownList) {
      dropdownList.classList.remove('w--open');
      this.setDropdownTabIndex(dropdownList, false); // Hide content from tab order
    }

    if (this.currentOpenDropdown === dropdown) {
      this.currentOpenDropdown = null;
    }
  }

  /**
   * Close all dropdowns
   */
  private closeAllDropdowns(): void {
    if (!this.dropdowns) return;

    this.dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector('.w-dropdown-toggle') as HTMLElement;
      const dropdownList = dropdown.querySelector('.w-dropdown-list') as HTMLElement;

      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('w--open');
      }

      if (dropdownList) {
        dropdownList.classList.remove('w--open');
        this.setDropdownTabIndex(dropdownList, false); // Hide content from tab order
      }
    });

    this.currentOpenDropdown = null;
  }

  /**
   * Set tabindex on all focusable elements in dropdown
   * When open: tabindex="0" (focusable)
   * When closed: tabindex="-1" (not focusable)
   */
  private setDropdownTabIndex(dropdownList: HTMLElement, isOpen: boolean): void {
    const focusableElements = dropdownList.querySelectorAll<HTMLElement>(
      'a[href], button, [role="tab"], [role="button"]'
    );

    focusableElements.forEach((element) => {
      if (isOpen) {
        element.setAttribute('tabindex', '0');
      } else {
        element.setAttribute('tabindex', '-1');
      }
    });
  }

  /**
   * Setup focus trap for dropdown content
   */
  private setupDropdownFocusTrap(dropdown: HTMLElement, dropdownList: HTMLElement): void {
    const focusableElements = dropdownList.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      element.addEventListener('keydown', (e: KeyboardEvent) => {
        const toggle = dropdown.querySelector('.w-dropdown-toggle') as HTMLElement;
        const isExpanded = toggle?.getAttribute('aria-expanded') === 'true';

        if (!isExpanded) return;

        switch (e.key) {
          case 'Tab':
            // Handle tab within dropdown
            if (e.shiftKey && index === 0) {
              // Shift+Tab on first item - go back to toggle
              e.preventDefault();
              toggle?.focus();
            } else if (!e.shiftKey && index === focusableElements.length - 1) {
              // Tab on last item - close dropdown and move to next nav item
              this.closeDropdown(dropdown, toggle, dropdownList);
            }
            break;

          case 'Escape':
            e.preventDefault();
            this.closeDropdown(dropdown, toggle, dropdownList);
            toggle?.focus();
            break;

          case 'ArrowDown':
            // Navigate to next item in dropdown
            if (index < focusableElements.length - 1) {
              e.preventDefault();
              focusableElements[index + 1].focus();
            }
            break;

          case 'ArrowUp':
            // Navigate to previous item in dropdown
            if (index > 0) {
              e.preventDefault();
              focusableElements[index - 1].focus();
            } else {
              // If on first item, go back to toggle
              e.preventDefault();
              toggle?.focus();
            }
            break;

          case 'Home':
            // Jump to first item
            e.preventDefault();
            focusableElements[0].focus();
            break;

          case 'End':
            // Jump to last item
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
            break;
        }
      });
    });
  }

  /**
   * Focus the first focusable item in dropdown
   */
  private focusFirstItem(dropdownList: HTMLElement | null): void {
    if (!dropdownList) return;

    const firstItem = dropdownList.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (firstItem) {
      firstItem.focus();
    }
  }

  /**
   * Focus the last focusable item in dropdown
   */
  private focusLastItem(dropdownList: HTMLElement | null): void {
    if (!dropdownList) return;

    const items = dropdownList.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (items.length > 0) {
      items[items.length - 1].focus();
    }
  }
}

/**
 * Initialize NavAccessibility
 */
export function initNavAccessibility(): void {
  new NavAccessibility();
}
