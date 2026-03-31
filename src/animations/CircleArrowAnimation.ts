import { gsap } from 'gsap';

/**
 * Circle Arrow Animation
 *
 * On page load:
 * 1. Sets opacity:1 on .header_main-decor — CSS transition (set in Webflow) handles the fade.
 * 2. GSAP animates the SVG: floats upward + rotates in for momentum.
 * 3. The arrowhead path travels a little further along the circle's tangent.
 *
 * Expected HTML structure:
 * <div class="header_main-decor">        ← opacity:0 + transition set in Webflow
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

    // The filled gradient arrowhead is the last <path> in the SVG
    const arrowHead = svgEl.querySelector('path:last-of-type') as SVGPathElement | null;

    // Outer wrapper has opacity:0 + CSS transition set in Webflow — just flip to 1
    const outerWrapper = container.closest<HTMLElement>('.header_main-decor');
    if (outerWrapper) {
      outerWrapper.style.opacity = '1';
    }

    // SVG: float upward + rotate in for momentum (starts slightly rotated CCW, settles to 0)
    gsap.fromTo(
      svgEl,
      { y: 10, rotation: -12, transformOrigin: '50% 50%' },
      { y: -15, rotation: 0, duration: 1.4, ease: 'power2.out', delay: 0.2 }
    );

    // Arrowhead: travels further along the circle's tangent
    // Circle center (309, 313), arrowhead ~(220, 109)
    // CCW tangent ≈ (+0.916, -0.400) × 20px → x:+18, y:-8
    if (arrowHead) {
      gsap.fromTo(
        arrowHead,
        { x: 0, y: 0 },
        { x: 18, y: -8, duration: 1.6, ease: 'power2.out', delay: 0.2 }
      );
    }
  });
};
