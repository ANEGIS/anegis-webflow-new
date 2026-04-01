import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

export const initSectionHeaderAnimation = () => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  gsap.utils.toArray<HTMLElement>('section').forEach((section) => {
    const h2 = section.querySelector<HTMLElement>('h2');
    const desc = section.querySelector<HTMLElement>('.section_header-description');

    if (!h2 && !desc) return;

    const tl = gsap.timeline({ paused: true });

    if (h2) {
      const split = new SplitText(h2, { type: 'lines', linesClass: 'split-line' });
      gsap.set(split.lines, { overflow: 'hidden', display: 'block' });
      const wrappedLines = split.lines.map((line) => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        line.parentNode!.insertBefore(wrapper, line);
        wrapper.appendChild(line);
        return line;
      });
      tl.from(wrappedLines, {
        y: '101%',
        duration: 0.8,
        ease: 'power1.out',
        stagger: 0.1,
      });
    }

    if (desc) {
      tl.from(desc, { opacity: 0, duration: 0.6, ease: 'power1.out' }, h2 ? '0.3' : 0);
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => tl.play(),
    });
  });
};
