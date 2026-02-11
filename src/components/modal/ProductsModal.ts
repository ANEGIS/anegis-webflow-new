import { startLenis, stopLenis } from '../../animations/SmoothScroll';

interface GSAP {
  to(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): GSAPTween;
  fromTo(
    target: string | Element | NodeList | Element[],
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>
  ): GSAPTween;
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
  timeline(vars?: Record<string, unknown>): GSAPTimeline;
}

interface GSAPTween {
  delay(value: number): GSAPTween;
}

interface GSAPTimeline {
  to(
    target: string | Element | NodeList | Element[],
    vars: Record<string, unknown>,
    position?: string | number
  ): GSAPTimeline;
  fromTo(
    target: string | Element | NodeList | Element[],
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
    position?: string | number
  ): GSAPTimeline;
  set(
    target: string | Element | NodeList | Element[],
    vars: Record<string, unknown>,
    position?: string | number
  ): GSAPTimeline;
  play(): GSAPTimeline;
  reverse(): GSAPTimeline;
}

declare const gsap: GSAP;

export function initProductsModal() {
  const modal = document.querySelector<HTMLElement>('[data-modal]');
  if (!modal) return;

  const triggers = document.querySelectorAll<HTMLElement>('[data-product-trigger]');
  const closeButtons = document.querySelectorAll<HTMLElement>('[data-close-modal]');
  const modalTargets = modal.querySelectorAll<HTMLElement>('.product_item-modal-inner');

  // Set initial state
  // Set initial state
  gsap.set(modal, {
    display: 'none',
    opacity: 0,
    zIndex: -1,
    pointerEvents: 'none',
  });

  // Hide all contents initially
  gsap.set(modalTargets, { display: 'none', opacity: 0 });

  // Function to open modal
  const openModal = (targetId: string) => {
    // Find the target content
    // Priority: data-modal-target, then id
    let targetContent: HTMLElement | null = null;

    // Check if targetId matches an ID
    const potentialById = document.getElementById(targetId);
    if (potentialById && modal.contains(potentialById)) {
      targetContent = potentialById;
    } else {
      // Check data-modal-target (if implemented later)
      targetContent = modal.querySelector<HTMLElement>(`[data-modal-target="${targetId}"]`);
    }

    if (!targetContent) {
      console.error(`No content found for target: ${targetId}`);
      return;
    }

    const isModalOpen =
      getComputedStyle(modal).display !== 'none' && getComputedStyle(modal).opacity !== '0';

    if (isModalOpen) {
      // If modal is already open, just switch content
      // Hide currently visible content
      modalTargets.forEach((content) => {
        if (content !== targetContent && content.style.display !== 'none') {
          gsap.to(content, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
              content.style.display = 'none';
            },
          });
        }
      });

      // Show new content
      gsap.set(targetContent, { display: 'block', opacity: 0, y: 10 });
      gsap.to(targetContent, { opacity: 1, y: 0, duration: 0.3, delay: 0.2 });
    } else {
      // Logic for first opening
      document.body.style.overflow = 'hidden';
      stopLenis();

      // Hide all contents first to be sure
      modalTargets.forEach((content) => {
        content.style.display = 'none';
      });

      // Prepare target content
      gsap.set(targetContent, { display: 'block', opacity: 1 });

      // Animate Modal Wrapper
      const tl = gsap.timeline();

      tl.set(modal, {
        display: 'flex',
        opacity: 0,
        zIndex: 2147483647, // Max safe 32-bit integer to avoid overflow
        pointerEvents: 'auto',
      }).to(modal, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  };

  // Function to close modal
  const closeModal = () => {
    // Animate content out?
    // Just fade out modal wrapper is usually enough and cleaner
    gsap.to(modal, {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(modal, { display: 'none', zIndex: -1 });
        // Reset contents?
        gsap.set(modalTargets, { display: 'none' });
        document.body.style.overflow = '';
        startLenis();
      },
    });
  };

  // Setup Triggers
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      // Ensure we get the attribute, handling nested elements if the click hits a child
      const targetId = trigger
        .closest('[data-product-trigger]')
        ?.getAttribute('data-product-trigger');
      if (targetId) {
        openModal(targetId);
      }
    });
  });

  // Setup Close Buttons
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const isModalOpen =
        getComputedStyle(modal).display !== 'none' && getComputedStyle(modal).opacity !== '0';
      if (isModalOpen) closeModal();
    }
  });
}
