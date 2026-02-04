import { greetUser } from '$utils/greet';

import { initBlobAnimation } from './animations/BlobAnimation';
import { initMarquee } from './animations/Marquee';
import { initScrollLine } from './animations/ScrollLine';
import { initSmoothScroll } from './animations/SmoothScroll';
import { initFaqCards } from './components/cards/FaqCards';
import { initCustomCursor } from './components/cursor/CustomCursor';
import { initAccessibleDropdown } from './components/dropdown/AccessibleDropdown';
import { initSmartNav } from './components/layout/SmartNav';
import { initMegaMenuAccordion } from './components/menu/MegaMenuAccordion';
import { initMobileSliders } from './components/sliders/MobileSlider';
import { initSwiperSlider } from './components/sliders/SwiperSlider';
import { initMobileTabs } from './components/tabs/MobileTabs';
import { initTabLists } from './components/tabs/TabsAutomatic';

window.Webflow ||= [];
window.Webflow.push(() => {
  greetUser();
  initSmoothScroll();

  // Initialize all components
  initTabLists();
  initMobileTabs();
  initSmartNav();
  initMegaMenuAccordion();
  initFaqCards();
  initSwiperSlider();
  initMobileSliders();
  initCustomCursor();
  initScrollLine();
  initAccessibleDropdown();
  initMarquee();
  initBlobAnimation();
});
