const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0
  );

export function initFormModal() {
  let lastFocused: HTMLElement | null = null;

  const getModal = () => document.querySelector<HTMLElement>('[data-form-modal]');

  const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const modal = getModal();
    if (!modal) return;
    const focusable = getFocusableElements(modal);
    e.preventDefault(); // Always prevent default to stop browser scroll on Tab

    if (!focusable.length) return;

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

    if (e.shiftKey) {
      const prev = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      focusable[prev].focus({ preventScroll: true });
    } else {
      const next = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
      focusable[next].focus({ preventScroll: true });
    }
  };

  const openModal = () => {
    const modal = getModal();
    if (!modal) return;

    lastFocused = document.activeElement as HTMLElement;
    modal.classList.add('is-active');

    // Focus first focusable element once modal is visible
    requestAnimationFrame(() => {
      const focusable = getFocusableElements(modal);
      if (focusable.length) focusable[0].focus({ preventScroll: true });
      else {
        modal.setAttribute('tabindex', '-1');
        modal.focus({ preventScroll: true });
      }
    });

    document.addEventListener('keydown', trapFocus);
  };

  const closeModal = () => {
    const modal = getModal();
    if (!modal) return;

    modal.classList.remove('is-active');

    document.removeEventListener('keydown', trapFocus);

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
