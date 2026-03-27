import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Timeline section animation (desktop only, ≥ 992px).
 *
 * When the `.timeline-component` scrolls into view:
 * 1. `.timeline-line-wrapper` fades in (opacity 0→1) and grows (width 0%→100%).
 * 2. Each `.timeline-dot-wrapper` appears sequentially, staggered along the
 *    line's expansion so dots "pop in" as the line reaches them.
 */
export const initTimelineAnimation = (): void => {
  gsap.registerPlugin(ScrollTrigger);

  // Desktop-only guard
  const mm = gsap.matchMedia();

  mm.add('(min-width: 992px)', () => {
    const components = document.querySelectorAll<HTMLElement>('.timeline-component');

    components.forEach((component) => {
      const lineWrapper = component.querySelector<HTMLElement>('.timeline-line-wrapper');
      const dots = component.querySelectorAll<HTMLElement>('.timeline-dot-wrapper');

      if (!lineWrapper || dots.length === 0) return;

      // --- Initial state -------------------------------------------------
      gsap.set(lineWrapper, { opacity: 0, width: '0%' });
      gsap.set(dots, { opacity: 0, scale: 0 });

      // --- Build the timeline --------------------------------------------
      const tl = gsap.timeline({
        paused: true,
      });

      // Line grows across the full width
      tl.to(lineWrapper, {
        opacity: 1,
        width: '100%',
        duration: 1.4,
        ease: 'power2.inOut',
      });

      // Dots appear while the line expands.
      // They are staggered evenly across the line's duration so they feel
      // "attached" to the expanding line.
      const dotCount = dots.length;
      const lineDuration = 1.4; // must match the line tween above
      const staggerInterval = lineDuration / dotCount;

      dots.forEach((dot, i) => {
        // Each dot starts at an even fraction of the line animation
        const startTime = staggerInterval * i;

        tl.to(
          dot,
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.7)',
          },
          startTime // absolute position inside the timeline
        );
      });

      // --- Scroll trigger ------------------------------------------------
      ScrollTrigger.create({
        trigger: component,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          tl.play();
        },
      });
    });

    // Refresh positions when the page is fully settled
    window.addEventListener('load', () => {
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    });
  });
};
