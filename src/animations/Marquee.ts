/**
 * Perfect Infinite Marquee Animation
 *
 * Logic:
 * 1. Duplicates the marquee list to create a seamless loop.
 * 2. Injects critical CSS to handle the animation and spacing.
 * 3. Uses a calc() translation to account for the specific 3rem gap.
 */
export const initMarquee = (options: { pauseOnHover: boolean } = { pauseOnHover: false }) => {
  const component = document.querySelector('.banner_component');
  const wrapper = document.querySelector('.banner_inner-wrapper') as HTMLElement;
  const marquee = document.querySelector('.banner_marquee') as HTMLElement;

  if (!component || !wrapper || !marquee) return;

  // 1. Inject CSS Styles for the animation
  // We strictly check for ID to prevent double-injection during hot reloads
  const styleId = 'perfect-marquee-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;

    // Conditionally add hover pause styles
    const hoverStyles = options.pauseOnHover
      ? `
      /* Pause on hover for better UX (Optional) */
      .banner_component:hover .banner_marquee {
        animation-play-state: paused;
      }
    `
      : '';

    style.textContent = `
      .banner_inner-wrapper {
        /* Ensure the gap between the original and clone matches the internal grid gap */
        column-gap: 3rem; 
      }
      
      .banner_marquee {
        /* Animate the list */
        animation: scroll-left 30s linear infinite;
        will-change: transform;
        /* Ensure layout is stable */
        grid-auto-flow: column; 
      }
      
      @keyframes scroll-left {
        from {
          transform: translateX(0);
        }
        to {
          /* 
           * IMPORTANT: 
           * We translate by -100% of the element's width 
           * PLUS the column-gap (3rem) so it lines up perfectly.
           */
          transform: translateX(calc(-100% - 3rem));
        }
      }
      ${hoverStyles}
    `;
    document.head.appendChild(style);
  }

  // 2. Clone the marquee list
  // Only clone if we haven't already (checks for multiple children)
  // We assume the wrapper starts with only 1 child (the original marquee)
  const existingMarquees = wrapper.querySelectorAll('.banner_marquee');
  if (existingMarquees.length === 1) {
    const clone = marquee.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('is-clone');
    wrapper.appendChild(clone);
  }
};
