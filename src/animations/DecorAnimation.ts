import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const initDecorAnimation = () => {
  gsap.registerPlugin(ScrollTrigger);

  const containers = document.querySelectorAll('.decor_arrow-wrapper');

  containers.forEach((container) => {
    const middleDecor = container.querySelector('.decor-middle') as HTMLElement;
    const topDecor = container.querySelector('.decor-top') as HTMLElement;
    const triggerElement = container as HTMLElement;

    // 1. Setup the timeline (don't attach ScrollTrigger directly here)
    const tl = gsap.timeline({
      paused: true, // Don't play until ScrollTrigger says so
    });

    // STEP 1 - Fade in the container
    tl.to(triggerElement, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
    })
      // STEP 2 & 3 - Shoot children upward
      .add('rideAlong', '-=0.3');

    if (middleDecor) {
      tl.fromTo(
        middleDecor,
        { y: 0, xPercent: -50 },
        {
          y: -15,
          xPercent: -50,
          duration: 1.0,
          ease: 'power2.out',
        },
        'rideAlong'
      );
    }

    if (topDecor) {
      tl.fromTo(
        topDecor,
        { y: 0, xPercent: -50 },
        {
          y: -60,
          xPercent: -50,
          duration: 1.2,
          ease: 'power2.out',
        },
        'rideAlong'
      );
    }

    // 2. Create the Trigger separately
    ScrollTrigger.create({
      trigger: triggerElement,
      start: 'top 85%',
      once: true, // Only ever trigger once per page load
      onEnter: () => {
        // Only set initial state and play when specifically entering the viewport
        gsap.set(triggerElement, { opacity: 0 });
        tl.play();
      },
    });
  });

  // Re-calculate all positions after page is fully settled
  window.addEventListener('load', () => {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  });
};
