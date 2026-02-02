declare global {
  interface Window {
    jQuery?: any;
    $: any;
  }
}

export function initAccessibleDropdown() {
  const dropdowns = document.querySelectorAll('.w-dropdown');

  function closeWebflowDropdown(dropdown: Element) {
    const dropdownToggle = dropdown.querySelector('.w-dropdown-toggle');
    const dropdownList = dropdown.querySelector('.w-dropdown-list');
    const dropdownIcon = dropdown.querySelector('.dropdown_icon');

    if (dropdownToggle) {
      dropdownToggle.classList.remove('w--open');
      dropdownToggle.setAttribute('aria-expanded', 'false');
    }
    if (dropdownList) dropdownList.classList.remove('w--open');
    if (dropdownIcon) dropdownIcon.classList.remove('is-open');

    if (window.jQuery) {
      window.jQuery(dropdown).trigger('w-close.w-dropdown');
    }
  }

  dropdowns.forEach((dropdown) => {
    const dropdownToggle = dropdown.querySelector('.w-dropdown-toggle');
    const dropdownList = dropdown.querySelector('.w-dropdown-list');
    const dropdownIcon = dropdown.querySelector('.dropdown_icon');

    if (!dropdownToggle || !dropdownList) return;

    const dropdownLinks = dropdownList.querySelectorAll('a');

    // Close on Tab out
    dropdownLinks.forEach((link) => {
      link.addEventListener('keydown', (event: Event) => {
        const e = event as KeyboardEvent;
        if (e.key === 'Tab') {
          setTimeout(() => {
            if (!dropdown.contains(document.activeElement)) {
              closeWebflowDropdown(dropdown);
            }
          }, 0);
        }
      });
    });

    // Close on Escape
    dropdown.addEventListener('keydown', (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.key === 'Escape' && dropdownList.classList.contains('w--open')) {
        closeWebflowDropdown(dropdown);
        (dropdownToggle as HTMLElement).focus();
        e.preventDefault();
      }
    });

    // Observer for external state changes (e.g. Webflow's native JS)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isOpen = dropdownToggle.classList.contains('w--open');
          if (dropdownIcon) {
            if (isOpen) dropdownIcon.classList.add('is-open');
            else dropdownIcon.classList.remove('is-open');
          }
        }
      });
    });
    observer.observe(dropdownToggle, { attributes: true });
  });

  // Global focus listener (event delegation) implementation would attach to document,
  // but here we just need to ensure we don't duplicate listeners if re-initialized.
  // The snippet provided attached to document directly.
  // Since this is init function possibly running once, keep it simple.

  // Note: Avoid duplicate listeners if this init runs multiple times?
  // For now assuming single run.
  document.addEventListener('focusin', (event) => {
    dropdowns.forEach((dropdown) => {
      const dropdownList = dropdown.querySelector('.w-dropdown-list');
      if (dropdownList && dropdownList.classList.contains('w--open')) {
        if (!dropdown.contains(event.target as Node)) {
          closeWebflowDropdown(dropdown);
        }
      }
    });
  });
}
