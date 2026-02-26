/**
 * Accessible Button Focus Handler
 *
 * Adds visual focus states to button wrappers when their inner links receive keyboard focus.
 * This improves accessibility by making keyboard navigation more visible.
 */
export function initAccessibleButtons() {
  const buttonWrappers = document.querySelectorAll('.button-wrapper');

  buttonWrappers.forEach((wrapper) => {
    const link = wrapper.querySelector<HTMLAnchorElement>('.button-link, a');

    if (link) {
      // Add focus class when link receives focus via keyboard
      link.addEventListener('focus', () => {
        // Only show focus state if navigated via keyboard (standard way to detect this)
        if (link.matches(':focus-visible')) {
          wrapper.classList.add('is-focused');
        }
      });

      // Remove focus class when link loses focus
      link.addEventListener('blur', () => {
        wrapper.classList.remove('is-focused');
      });

      // Ensure that a mouse click explicitly removes the focus class
      link.addEventListener('mousedown', () => {
        wrapper.classList.remove('is-focused');
      });
    }
  });
}
