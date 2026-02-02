import { greetUser } from '$utils/greet';

import { initFaqCards } from './components/cards/FaqCards';
import { initCustomCursor } from './components/cursor/CustomCursor';
import { initSmartNav } from './components/layout/SmartNav';
import { initSwiperSlider } from './components/sliders/SwiperSlider';
import { initTabLists } from './components/tabs/TabsAutomatic';

window.Webflow ||= [];
window.Webflow.push(() => {
  const name = 'John Doe';
  greetUser(name);

  // Initialize all components
  initTabLists();
  initSmartNav();
  initFaqCards();
  initSwiperSlider();
  initCustomCursor();
});
