interface GSAP {
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
  to(target: string | Element | NodeList | Element[] | null, vars: Record<string, unknown>): void;
  getProperty(target: Element, property: string): string | number;
}

declare const gsap: GSAP;

/**
 * WCAG-Compliant FAQ Cards / Accordion Component
 *
 * Accessibility Features:
 * - Keyboard navigation (Enter, Space, Arrow keys)
 * - Proper ARIA attributes (aria-expanded, aria-controls, role)
 * - Focus management
 * - Screen reader support
 */

export function initFaqCards() {
  const cards = document.querySelectorAll('.layout_card.is-faq');
  const images = document.querySelectorAll('.about_component-image-outer');

  // 1. Initial Setup: Hide all images instantly and prevent stretching
  gsap.set('.layout-card-bottom', { height: 0, overflow: 'hidden', display: 'block' });
  gsap.set(images, {
    autoAlpha: 0,
    display: 'none',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  });

  // Ensure inner images also cover
  const innerImages = document.querySelectorAll('.about_component-image-outer img');
  gsap.set(innerImages, { width: '100%', height: '100%', objectFit: 'cover' });

  // 2. Setup ARIA attributes for accessibility
  cards.forEach((card, index) => {
    const top = card.querySelector('.layout_card-top');
    const bottom = card.querySelector('.layout-card-bottom');

    if (top && bottom) {
      // Generate unique IDs if they don't exist
      const triggerId = top.id || `faq-trigger-${index}`;
      const panelId = bottom.id || `faq-panel-${index}`;

      top.id = triggerId;
      bottom.id = panelId;

      // Set ARIA attributes on trigger (button role)
      top.setAttribute('role', 'button');
      top.setAttribute('aria-expanded', 'false');
      top.setAttribute('aria-controls', panelId);
      top.setAttribute('tabindex', '0');

      // Set ARIA attributes on panel
      bottom.setAttribute('role', 'region');
      bottom.setAttribute('aria-labelledby', triggerId);
      bottom.setAttribute('aria-hidden', 'true');
    }
  });

  // 3. Animation Function with ARIA updates
  function animateCard(card: Element, isOpen: boolean) {
    const bottom = card.querySelector('.layout-card-bottom');
    const iconWrapper = card.querySelector('.layout_action-icon');
    const top = card.querySelector('.layout_card-top');

    // Get ID and find the SPECIFIC matching image
    const id = card.getAttribute('data-card');
    const img = document.querySelector(`.about_component-image-outer[data-image="${id}"]`);

    // Update ARIA attributes
    if (top) {
      top.setAttribute('aria-expanded', String(isOpen));
    }
    if (bottom) {
      bottom.setAttribute('aria-hidden', String(!isOpen));
    }

    if (isOpen) {
      if (bottom) {
        gsap.to(bottom, { height: 'auto', duration: 0.6, ease: 'power3.inOut' });
      }
      if (iconWrapper) iconWrapper.classList.add('is-active');

      if (img) {
        // Force display block first, then animate opacity
        gsap.set(img, { display: 'block', zIndex: 2 });
        gsap.to(img, { autoAlpha: 1, duration: 0.6, ease: 'power3.inOut', overwrite: true });
      }
    } else {
      gsap.to(bottom, { height: 0, duration: 0.6, ease: 'power3.inOut' });
      if (iconWrapper) iconWrapper.classList.remove('is-active');

      if (img) {
        gsap.set(img, { zIndex: 1 });
        gsap.to(img, {
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.inOut',
          onComplete: () => gsap.set(img, { display: 'none' }),
        });
      }
    }
  }

  // 4. Find the first card that actually has a matching image and open it
  const firstValidCard = Array.from(cards).find((card) => {
    const id = card.getAttribute('data-card');
    return document.querySelector(`.about_component-image-outer[data-image="${id}"]`);
  });

  if (firstValidCard) {
    animateCard(firstValidCard, true);
  }

  // 5. Toggle handler (shared by click and keyboard)
  function toggleCard(card: Element) {
    const bottom = card.querySelector('.layout-card-bottom');
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
  }

  // 6. Event Handlers (Click + Keyboard)
  cards.forEach((card) => {
    const top = card.querySelector('.layout_card-top');

    if (top) {
      // Click handler
      top.addEventListener('click', () => {
        toggleCard(card);
      });

      // Keyboard handler
      top.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        switch (keyEvent.key) {
          case 'Enter':
          case ' ': // Spacebar
            keyEvent.preventDefault();
            toggleCard(card);
            break;

          case 'ArrowDown':
            keyEvent.preventDefault();
            focusNextCard(card, cards);
            break;

          case 'ArrowUp':
            keyEvent.preventDefault();
            focusPreviousCard(card, cards);
            break;

          case 'Home':
            keyEvent.preventDefault();
            focusFirstCard(cards);
            break;

          case 'End':
            keyEvent.preventDefault();
            focusLastCard(cards);
            break;
        }
      });
    }
  });

  // 7. Focus management functions
  function focusNextCard(currentCard: Element, cardsList: NodeListOf<Element>) {
    const cardsArray = Array.from(cardsList);
    const currentIndex = cardsArray.indexOf(currentCard);
    const nextIndex = (currentIndex + 1) % cardsArray.length;
    const nextTop = cardsArray[nextIndex].querySelector('.layout_card-top') as HTMLElement;
    if (nextTop) nextTop.focus();
  }

  function focusPreviousCard(currentCard: Element, cardsList: NodeListOf<Element>) {
    const cardsArray = Array.from(cardsList);
    const currentIndex = cardsArray.indexOf(currentCard);
    const prevIndex = currentIndex === 0 ? cardsArray.length - 1 : currentIndex - 1;
    const prevTop = cardsArray[prevIndex].querySelector('.layout_card-top') as HTMLElement;
    if (prevTop) prevTop.focus();
  }

  function focusFirstCard(cardsList: NodeListOf<Element>) {
    const firstTop = cardsList[0]?.querySelector('.layout_card-top') as HTMLElement;
    if (firstTop) firstTop.focus();
  }

  function focusLastCard(cardsList: NodeListOf<Element>) {
    const lastTop = cardsList[cardsList.length - 1]?.querySelector(
      '.layout_card-top'
    ) as HTMLElement;
    if (lastTop) lastTop.focus();
  }
}
