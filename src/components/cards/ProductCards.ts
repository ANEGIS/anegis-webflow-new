/**
 * Product Cards Hover Effect
 *
 * Logic:
 * 1. Listen for mouseenter/mouseleave on [data-product-trigger]
 * 2. Toggle .is-active class on child [data-tile-details]
 * 3. Handle scrolling animation for overflowing text within .product_tile-detaile-content
 */

interface GSAPTween {
  kill(): void;
}

interface GSAP {
  to(
    target: string | Element | NodeList | Element[] | null,
    vars: Record<string, unknown>
  ): GSAPTween;
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
  killTweensOf(target: string | Element | NodeList | Element[]): void;
}

declare const gsap: GSAP;

export function initProductCards() {
  const triggers = document.querySelectorAll<HTMLElement>('[data-product-trigger]');

  triggers.forEach((trigger) => {
    const details = trigger.querySelector<HTMLElement>('[data-tile-details]');
    if (!details) return;

    const contentWrapper = details.querySelector<HTMLElement>('.product_tile-detaile-content');
    if (!contentWrapper) return;

    // The text container (firstChild div in the markup provided)
    const textNode = contentWrapper.firstElementChild as HTMLElement;
    if (!textNode) return;

    // Safety styles to ensure scrolling works
    gsap.set(contentWrapper, {
      overflow: 'hidden',
      paddingLeft: '2px',
      paddingRight: '2px',
      boxSizing: 'border-box',
    });
    gsap.set(textNode, {
      display: 'block',
      width: 'max-content',
      paddingLeft: '0px',
      paddingRight: '2px', // Extra space at the end
    });

    let tween: GSAPTween | null = null;

    trigger.addEventListener('mouseenter', () => {
      // 1. Add active class
      details.classList.add('is-active');

      // 2. Handle text scrolling if needed
      // Subtract 16px (total horizontal padding) from wrapper width for calculation
      const scrollNeeded = textNode.offsetWidth - (contentWrapper.offsetWidth - 16);

      if (scrollNeeded > 0) {
        // Kill any existing reset animation
        gsap.killTweensOf(textNode);

        // Create scrolling animation
        // Speed: ~40px per second seems natural
        const duration = scrollNeeded / 30;

        tween = gsap.to(textNode, {
          x: -scrollNeeded,
          duration: duration,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
          repeatDelay: 1,
          delay: 0.3,
        });
      }
    });

    trigger.addEventListener('mouseleave', () => {
      // 1. Remove active class
      details.classList.remove('is-active');

      // 2. Reset text position
      if (tween) {
        if (typeof tween.kill === 'function') {
          tween.kill();
        }
        tween = null;
      }

      gsap.to(textNode, {
        x: 0,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
      });
    });
  });
}
