import { greetUser } from '$utils/greet';

import { initMarquee } from './animations/Marquee';
import { initScrollLine } from './animations/ScrollLine';
import { initFaqCards } from './components/cards/FaqCards';
import { initCustomCursor } from './components/cursor/CustomCursor';
import { initAccessibleDropdown } from './components/dropdown/AccessibleDropdown';
import { initSmartNav } from './components/layout/SmartNav';
import { initSwiperSlider } from './components/sliders/SwiperSlider';
import { initTabLists } from './components/tabs/TabsAutomatic';

window.Webflow ||= [];
window.Webflow.push(() => {
  greetUser();

  // Initialize all components
  initTabLists();
  initSmartNav();
  initFaqCards();
  initSwiperSlider();
  initCustomCursor();
  initScrollLine();
  initAccessibleDropdown();
  initMarquee();
});
