import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const initSectionHeaderAnimation = () => {
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray<HTMLElement>('section').forEach((section) => {
    const h2 = section.querySelector<HTMLElement>('h2');
    const desc = section.querySelector<HTMLElement>('.section_header-description');

    if (!h2 && !desc) return;

    const tl = gsap.timeline({ paused: true });

    if (h2) tl.from(h2, { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' });
    if (desc) tl.from(desc, { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' }, '-=0.35');

    ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => tl.play(),
    });
  });
};
