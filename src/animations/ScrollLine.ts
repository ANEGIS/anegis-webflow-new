interface GSAP {
  to(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;
}

declare const gsap: GSAP;

export function initScrollLine() {
  const line = document.querySelector('[data-line-scroll] line');
  if (!line) return;

  const svg = line.closest('svg');
  if (svg) {
    gsap.set(svg, { attr: { preserveAspectRatio: 'none' } });
  }

  // The dasharray is "8 8", so the pattern repeats every 16 units.
  // To simulate movement, we animate the dashOffset by this amount (or a multiple).
  // Moving from Top to Bottom on a vertical line.

  // We set infinite linear animation
  gsap.to(line, {
    strokeDashoffset: -16, // Move by one pattern length
    duration: 1, // Adjust speed as needed (1s for 16px speed)
    ease: 'none',
    repeat: -1,
  });
}
