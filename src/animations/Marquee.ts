/**
 * Perfect Infinite Marquee Animation
 *
 * Logic:
 * 1. Creates multiple duplicates of the marquee to ensure seamless coverage.
 * 2. Uses CSS animations for smooth, GPU-accelerated performance.
 * 3. Implements proper seamless looping by resetting position at the exact moment.
 */

interface GSAP {
  set(target: Element | NodeList | string, vars: Record<string, unknown>): void;
  to(target: Element | NodeList | string, vars: Record<string, unknown>): GSAPTween;
}

interface GSAPTween {
  pause(): void;
  resume(): void;
}

declare const gsap: GSAP;

export const initMarquee = (options: { pauseOnHover: boolean } = { pauseOnHover: false }) => {
  const component = document.querySelector('.banner_component');
  const wrapper = document.querySelector('.banner_inner-wrapper') as HTMLElement;
  const marquee = document.querySelector('.banner_marquee') as HTMLElement;

  if (!component || !wrapper || !marquee) return;

  // Clean up any existing clones first
  const existingClones = wrapper.querySelectorAll('.banner_marquee.is-clone');
  existingClones.forEach((clone) => clone.remove());

  // Get the marquee width before cloning
  const marqueeWidth = marquee.offsetWidth;
  const gap = 48; // 3rem = 48px (assuming 1rem = 16px)

  // 1. Inject CSS Styles for layout and animation
  const styleId = 'perfect-marquee-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;

    // Conditionally add hover pause styles
    const hoverStyles = options.pauseOnHover
      ? `
      .banner_component:hover .banner_marquee {
        animation-play-state: paused !important;
      }
    `
      : '';

    style.textContent = `
      .banner_inner-wrapper {
        display: flex;
        column-gap: 3rem;
        flex-wrap: nowrap;
        width: max-content;
      }
      
      .banner_marquee {
        display: grid;
        grid-auto-flow: column;
        flex-shrink: 0;
        animation: marquee-scroll 30s linear infinite;
      }

      @keyframes marquee-scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(calc(-100% - 3rem));
        }
      }
      ${hoverStyles}
    `;
    document.head.appendChild(style);
  }

  // 2. Create enough clones to ensure seamless coverage
  // Calculate how many clones we need based on viewport width
  const viewportWidth = window.innerWidth;
  const itemWidth = marqueeWidth + gap;
  const clonesNeeded = Math.max(3, Math.ceil((viewportWidth * 2) / itemWidth));

  for (let i = 0; i < clonesNeeded; i++) {
    const clone = marquee.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('is-clone');
    wrapper.appendChild(clone);
  }

  // 3. Use GSAP for even smoother animation with seamless looping
  if (typeof gsap !== 'undefined') {
    // Remove CSS animation since we're using GSAP
    const allMarquees = wrapper.querySelectorAll('.banner_marquee');
    allMarquees.forEach((item) => {
      const el = item as HTMLElement;
      el.style.animation = 'none';
    });

    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      const totalDistance = marqueeWidth + gap;

      // Animate all marquees together with seamless looping
      const tween = gsap.to(allMarquees, {
        x: -totalDistance,
        duration: 30,
        ease: 'none',
        repeat: -1,
      });

      // Optional: pause on hover
      if (options.pauseOnHover && component) {
        component.addEventListener('mouseenter', () => tween.pause());
        component.addEventListener('mouseleave', () => tween.resume());
      }
    });
  }
};
