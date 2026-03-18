export function initFormModal() {
  const closeModal = () => {
    const modal = document.querySelector<HTMLElement>('[data-form-modal]');
    modal?.classList.remove('is-active');
  };

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Open
    if (target.closest('[data-trigger="form"]')) {
      const modal = document.querySelector<HTMLElement>('[data-form-modal]');
      if (modal) modal.classList.add('is-active');
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
