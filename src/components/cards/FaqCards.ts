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
  function animateCard(card: Element, isOpen: boolean) {
    const bottom = card.querySelector('.layout-card-bottom');
    const iconWrapper = card.querySelector('.layout_action-icon');
    const top = card.querySelector('.layout_card-top');

    const id = card.getAttribute('data-card');
    const img = document.querySelector(`.about_component-image-outer[data-image="${id}"]`);

    if (top) top.setAttribute('aria-expanded', String(isOpen));
    if (bottom) bottom.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      if (bottom) gsap.to(bottom, { height: 'auto', duration: 0.6, ease: 'power3.inOut' });
      if (iconWrapper) iconWrapper.classList.add('is-active');
      if (img) {
        gsap.set(img, { display: 'block', zIndex: 2 });
        gsap.to(img, { autoAlpha: 1, duration: 0.6, ease: 'power3.inOut', overwrite: true });
      }
    } else {
      if (bottom) gsap.to(bottom, { height: 0, duration: 0.6, ease: 'power3.inOut' });
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

  function toggleCard(card: Element) {
    const top = card.querySelector('.layout_card-top');
    const isActive = top?.getAttribute('aria-expanded') === 'true';

    if (isActive) {
      const isAboutTab =
        !!card.closest('.about_component') ||
        !!document.querySelector(
          `.about_component-image-outer[data-image="${card.getAttribute('data-card')}"]`
        );
      if (isAboutTab) return;
      animateCard(card, false);
      return;
    }

    const allCards = document.querySelectorAll('.layout_card.is-faq');
    allCards.forEach((c) => {
      if (c !== card) animateCard(c, false);
    });

    animateCard(card, true);
  }

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

  function setupFAQCards() {
    const newCollections = document.querySelectorAll(
      '.layout_card.is-faq:not([data-faq-init="true"])'
    );
    const newCards = newCollections as NodeListOf<Element>;
    const newImages = document.querySelectorAll(
      '.about_component-image-outer:not([data-faq-init="true"])'
    );

    if (newImages.length > 0) {
      newImages.forEach((img) => img.setAttribute('data-faq-init', 'true'));
      gsap.set(newImages, {
        autoAlpha: 0,
        display: 'none',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
      });

      const innerImages = Array.from(newImages)
        .map((el) => el.querySelector('img'))
        .filter((img): img is HTMLImageElement => img !== null);
      gsap.set(innerImages, { width: '100%', height: '100%', objectFit: 'cover' });
    }

    if (newCards.length === 0) return;

    newCards.forEach((card) => {
      card.setAttribute('data-faq-init', 'true');
      const top = card.querySelector('.layout_card-top');
      const bottom = card.querySelector('.layout-card-bottom');

      if (bottom) {
        gsap.set(bottom, { height: 0, overflow: 'hidden', display: 'block' });
      }

      if (top && bottom) {
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const triggerId = top.id || `faq-trigger-${uniqueId}`;
        const panelId = bottom.id || `faq-panel-${uniqueId}`;

        top.id = triggerId;
        bottom.id = panelId;

        top.setAttribute('role', 'button');
        top.setAttribute('aria-expanded', 'false');
        top.setAttribute('aria-controls', panelId);
        top.setAttribute('tabindex', '0');

        bottom.setAttribute('role', 'region');
        bottom.setAttribute('aria-labelledby', triggerId);
        bottom.setAttribute('aria-hidden', 'true');
      }

      if (top) {
        top.addEventListener('click', () => toggleCard(card));
        top.addEventListener('keydown', (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          const allCards = document.querySelectorAll('.layout_card.is-faq');
          switch (keyEvent.key) {
            case 'Enter':
            case ' ':
              keyEvent.preventDefault();
              toggleCard(card);
              break;
            case 'ArrowDown':
              keyEvent.preventDefault();
              focusNextCard(card, allCards);
              break;
            case 'ArrowUp':
              keyEvent.preventDefault();
              focusPreviousCard(card, allCards);
              break;
            case 'Home':
              keyEvent.preventDefault();
              focusFirstCard(allCards);
              break;
            case 'End':
              keyEvent.preventDefault();
              focusLastCard(allCards);
              break;
          }
        });
      }
    });
    // Auto-open first valid item globally if none are open
    const hasActiveCard = document.querySelector(
      '.layout_card.is-faq .layout_action-icon.is-active'
    );
    if (!hasActiveCard) {
      const globalCards = Array.from(document.querySelectorAll('.layout_card.is-faq'));
      const firstValidCard = globalCards.find((card) => {
        const id = card.getAttribute('data-card');
        return document.querySelector(`.about_component-image-outer[data-image="${id}"]`);
      });

      if (firstValidCard) {
        animateCard(firstValidCard, true);
      }
    }
  }

  // Initial Initialization
  setupFAQCards();

  // Handle dynamically injected cards (e.g. Finsweet CMS Nest / Load)
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) {
      setupFAQCards();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
