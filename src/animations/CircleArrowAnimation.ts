import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Circle Arrow Animation
 *
 * Default (.circle-arrow_wrapper)
 *   — Animates on page load
 *   — CCW arrow, arrowhead at upper-left of circle
 *   — Rotation: -12 → 0 (settles clockwise)
 *   — Arrowhead tangent: x:+18, y:-8
 *   — Fades in via .header_main-decor CSS transition (set in Webflow)
 *
 * Footer (.circle-arrow_wrapper.is-footer)
 *   — Animates on scroll (ScrollTrigger)
 *   — CW arrow, arrowhead at ~12 o'clock
 *   — Rotation: +12 → 0 (settles counter-clockwise)
 *   — Arrowhead tangent: x:-20, y:-3
 *   — Fades in via .footer_main-decor CSS transition (set in Webflow)
 */
export const initCircleArrowAnimation = () => {
  gsap.registerPlugin(ScrollTrigger);

  const containers = document.querySelectorAll<HTMLElement>('.circle-arrow_wrapper');

  containers.forEach((container) => {
    const svgEl = container.querySelector('svg') as SVGElement | null;
    if (!svgEl) return;

    const arrowHead = svgEl.querySelector('path:last-of-type') as SVGPathElement | null;
    const isFooter = container.classList.contains('is-footer');

    // CW arrow starts slightly positive rotation, CCW starts slightly negative
    const startRotation = isFooter ? 12 : -12;

    // CCW arrowhead (upper-left, ~10 o'clock): tangent ≈ (+0.916, -0.400) × 20px
    // CW arrowhead (~12 o'clock):              tangent ≈ (-0.988, -0.153) × 20px
    const tangent = isFooter ? { x: -20, y: -3 } : { x: 18, y: -8 };

    function play() {
      gsap.fromTo(
        svgEl,
        { y: 10, rotation: startRotation, transformOrigin: '50% 50%' },
        { y: -15, rotation: 0, duration: 1.4, ease: 'power2.out', delay: 0.2 }
      );

      if (arrowHead) {
        gsap.fromTo(
          arrowHead,
          { x: 0, y: 0 },
          { ...tangent, duration: 1.6, ease: 'power2.out', delay: 0.2 }
        );
      }
    }

    if (isFooter) {
      const outerWrapper = container.closest<HTMLElement>('.footer_main-decor');

      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          if (outerWrapper) outerWrapper.style.opacity = '1';
          play();
        },
      });
    } else {
      const outerWrapper = container.closest<HTMLElement>('.header_main-decor');
      if (outerWrapper) outerWrapper.style.opacity = '1';
      play();
    }
  });

  window.addEventListener('load', () => {
    setTimeout(() => ScrollTrigger.refresh(), 200);
  });
};
