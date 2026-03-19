const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) =>
      getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'
  );

export function initFormModal() {
  let lastFocused: HTMLElement | null = null;
  let trapFocusHandler: ((e: KeyboardEvent) => void) | null = null;

  const getModal = () => document.querySelector<HTMLElement>('[data-form-modal]');

  const openModal = () => {
    const modal = getModal();
    if (!modal) return;

    lastFocused = document.activeElement as HTMLElement;
    modal.classList.add('is-active');

    // Focus first focusable element once modal is visible
    requestAnimationFrame(() => {
      const focusable = getFocusableElements(modal);
      if (focusable.length) focusable[0].focus();
      else {
        modal.setAttribute('tabindex', '-1');
        modal.focus();
      }
    });

    trapFocusHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements(modal);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener('keydown', trapFocusHandler);
  };

  const closeModal = () => {
    const modal = getModal();
    if (!modal) return;

    modal.classList.remove('is-active');

    if (trapFocusHandler) {
      modal.removeEventListener('keydown', trapFocusHandler);
      trapFocusHandler = null;
    }

    lastFocused?.focus();
    lastFocused = null;
  };

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Open
    if (target.closest('[data-trigger="form"]')) {
      openModal();
      return;
    }

    // Close button
    if (target.closest('[data-close-modal]')) {
      closeModal();
      return;
    }

    // Backdrop click — only when clicking the modal overlay itself, not its children
    const modal = target.closest<HTMLElement>('[data-form-modal]');
    if (modal && target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}
