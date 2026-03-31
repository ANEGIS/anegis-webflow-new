import { gsap } from 'gsap';

/**
 * Circle Arrow Animation
 *
 * Handles two variants:
 *
 * Default (.circle-arrow_wrapper)
 *   — CCW arrow, arrowhead at upper-left of circle
 *   — Rotation: -12 → 0 (settles clockwise)
 *   — Arrowhead tangent: x:+18, y:-8
 *   — Fades in via .header_main-decor CSS transition (set in Webflow)
 *
 * Footer (.circle-arrow_wrapper.is-footer)
 *   — Fades in via .footer_main-decor CSS transition (set in Webflow)
 *
 * Footer (.circle-arrow_wrapper.is-footer)
 *   — CW arrow, arrowhead at ~12 o'clock
 *   — Rotation: +12 → 0 (settles counter-clockwise)
 *   — Arrowhead tangent: x:-20, y:-3
 *
 * Expected HTML structure:
 * <div class="header_main-decor">        ← opacity:0 + transition set in Webflow (default only)
 *   <div class="circle-arrow_wrapper">
 *     <svg>...</svg>
 *   </div>
 * </div>
 */
export const initCircleArrowAnimation = () => {
  const containers = document.querySelectorAll<HTMLElement>('.circle-arrow_wrapper');

  containers.forEach((container) => {
    const svgEl = container.querySelector('svg') as SVGElement | null;
    if (!svgEl) return;

    const arrowHead = svgEl.querySelector('path:last-of-type') as SVGPathElement | null;
    const isFooter = container.classList.contains('is-footer');

    if (isFooter) {
      // opacity:0 + CSS transition set on .footer_main-decor in Webflow
      const outerWrapper = container.closest<HTMLElement>('.footer_main-decor');
      if (outerWrapper) {
        outerWrapper.style.opacity = '1';
      }
    } else {
      // opacity:0 + CSS transition set on .header_main-decor in Webflow
      const outerWrapper = container.closest<HTMLElement>('.header_main-decor');
      if (outerWrapper) {
        outerWrapper.style.opacity = '1';
      }
    }

    // CW arrow starts slightly positive rotation, CCW starts slightly negative
    const startRotation = isFooter ? 12 : -12;

    gsap.fromTo(
      svgEl,
      { y: 10, rotation: startRotation, transformOrigin: '50% 50%' },
      { y: -15, rotation: 0, duration: 1.4, ease: 'power2.out', delay: 0.2 }
    );

    if (arrowHead) {
      // CCW arrowhead (upper-left, ~10 o'clock): tangent ≈ (+0.916, -0.400) × 20px
      // CW arrowhead (~12 o'clock):              tangent ≈ (-0.988, -0.153) × 20px
      const tangent = isFooter ? { x: -20, y: -3 } : { x: 18, y: -8 };

      gsap.fromTo(
        arrowHead,
        { x: 0, y: 0 },
        { ...tangent, duration: 1.6, ease: 'power2.out', delay: 0.2 }
      );
    }
  });
};
