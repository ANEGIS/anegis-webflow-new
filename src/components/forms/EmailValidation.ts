import freeEmailDomains from 'free-email-domains';

export const initEmailValidation = () => {
  const emailInputs = document.querySelectorAll('input[name="email"], input[type="email"]');

  emailInputs.forEach((input) => {
    const form = input.closest('form');

    const validateEmail = () => {
      const email = (input as HTMLInputElement).value.trim().toLowerCase();

      (input as HTMLInputElement).setCustomValidity('');

      if (email.length === 0) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
      }

      // Basic email structure validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        (input as HTMLInputElement).setCustomValidity('Please enter a valid email address.');
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        return;
      }

      const domain = email.split('@')[1];

      if (freeEmailDomains.includes(domain)) {
        (input as HTMLInputElement).setCustomValidity('Please enter a business email address.');
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        return;
      }

      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
    };

    input.addEventListener('input', function () {
      (input as HTMLInputElement).setCustomValidity('');
      input.classList.remove('is-valid', 'is-invalid');
    });

    input.addEventListener('blur', function () {
      validateEmail();
    });

    input.addEventListener('focus', function () {
      (input as HTMLInputElement).setCustomValidity('');
    });

    if (form) {
      form.addEventListener(
        'submit',
        function (e) {
          validateEmail();

          if (input.classList.contains('is-invalid')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            (input as HTMLInputElement).reportValidity();
          }
        },
        true
      ); // use capture phase to catch it before Webflow's handlers
    }
  });
};
