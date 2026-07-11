export const initNipValidation = () => {
  const nipInputs = document.querySelectorAll('input[name="nip"]');

  nipInputs.forEach((input) => {
    const form = input.closest('form');

    const normalize = () => {
      const digits = (input as HTMLInputElement).value.replace(/\D/g, '');
      (input as HTMLInputElement).value = digits;
    };

    const validateNIP = () => {
      const digits = (input as HTMLInputElement).value.replace(/\D/g, '');

      (input as HTMLInputElement).setCustomValidity('');

      if (digits.length === 0) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
      }

      if (digits.length !== 10) {
        (input as HTMLInputElement).setCustomValidity('NIP must contain exactly 10 digits.');
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        return;
      }

      const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        sum += Number(digits[i]) * weights[i];
      }

      const checksum = sum % 11;
      const isValid = checksum !== 10 && checksum === Number(digits[9]);

      input.classList.toggle('is-valid', isValid);
      input.classList.toggle('is-invalid', !isValid);

      if (!isValid) {
        (input as HTMLInputElement).setCustomValidity('Invalid NIP number.');
      }
    };

    input.addEventListener('input', function () {
      const start = (input as HTMLInputElement).selectionStart;
      const before = (input as HTMLInputElement).value;

      const cleaned = before.replace(/[^0-9\s-]/g, '');
      (input as HTMLInputElement).value = cleaned;

      // Keep cursor reasonably stable after cleanup
      if (start !== null) {
        (input as HTMLInputElement).setSelectionRange(start, start);
      }

      (input as HTMLInputElement).setCustomValidity('');
      input.classList.remove('is-valid', 'is-invalid');
    });

    input.addEventListener('blur', function () {
      normalize();
      validateNIP();
    });

    input.addEventListener('focus', function () {
      (input as HTMLInputElement).setCustomValidity('');
    });

    if (form) {
      form.addEventListener(
        'submit',
        function (e) {
          normalize();
          validateNIP();

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
