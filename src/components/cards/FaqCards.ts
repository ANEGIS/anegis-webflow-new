// Assuming GSAP is loaded globally via Webflow
interface GSAP {
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
  to(target: string | Element | NodeList | Element[] | null, vars: Record<string, unknown>): void;
  getProperty(target: Element, property: string): string | number;
}

declare const gsap: GSAP;

export function initFaqCards() {
  const cards = document.querySelectorAll('.layout_card.is-faq');
  const images = document.querySelectorAll('.about_component-imge-outer');

  // 1. Initial Setup: Hide all images instantly
  gsap.set('.layout-card-bottom', { height: 0, overflow: 'hidden', display: 'block' });
  gsap.set(images, { autoAlpha: 0, display: 'none' });

  // 2. Animation Function
  function animateCard(card: Element, isOpen: boolean) {
    const bottom = card.querySelector('.layout-card-bottom');
    const iconWrapper = card.querySelector('.layout_action-icon');

    // Get ID and find the SPECIFIC matching image
    const id = card.getAttribute('data-card');
    const img = document.querySelector(`.about_component-imge-outer[data-image="${id}"]`);

    if (isOpen) {
      if (bottom) {
        gsap.to(bottom, { height: 'auto', duration: 0.4, ease: 'power2.out' });
      }
      if (iconWrapper) iconWrapper.classList.add('is-active');

      if (img) {
        // Force display block first, then animate opacity
        gsap.set(img, { display: 'block', zIndex: 2 });
        gsap.to(img, { autoAlpha: 1, duration: 0.4, overwrite: true });
      } else {
        console.warn(`No image found for Card ID: ${id}`);
      }
    } else {
      gsap.to(bottom, { height: 0, duration: 0.3, ease: 'power2.in' });
      if (iconWrapper) iconWrapper.classList.remove('is-active');

      if (img) {
        gsap.set(img, { zIndex: 1 });
        gsap.to(img, {
          autoAlpha: 0,
          duration: 0.3,
          onComplete: () => gsap.set(img, { display: 'none' }),
        });
      }
    }
  }

  // 3. Find the first card that actually has a matching image and open it
  const firstValidCard = Array.from(cards).find((card) => {
    const id = card.getAttribute('data-card');
    return document.querySelector(`.about_component-imge-outer[data-image="${id}"]`);
  });

  if (firstValidCard) {
    animateCard(firstValidCard, true);
  }

  // 4. Click Handlers
  cards.forEach((card) => {
    const top = card.querySelector('.layout_card-top');

    if (top) {
      top.addEventListener('click', () => {
        const bottom = card.querySelector('.layout-card-bottom');
        // Check if active using gsap.getProperty (returns number/string)
        // We cast to number if it returns number, or check > 0
        const currentHeight = bottom ? gsap.getProperty(bottom, 'height') : 0;
        const isActive = parseFloat(String(currentHeight)) > 0;

        // Close all others
        cards.forEach((c) => {
          if (c !== card) animateCard(c, false);
        });

        // Toggle current
        if (!isActive) {
          animateCard(card, true);
        }
      });
    }
  });
}
