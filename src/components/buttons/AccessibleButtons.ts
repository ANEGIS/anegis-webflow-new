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
      // Add focus class when link receives focus
      link.addEventListener('focus', function () {
        wrapper.classList.add('is-focused');
      });

      // Remove focus class when link loses focus
      link.addEventListener('blur', function () {
        wrapper.classList.remove('is-focused');
      });
    }
  });
}
