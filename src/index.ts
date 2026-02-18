import { greetUser } from '$utils/greet';

import { initBlobAnimation } from './animations/BlobAnimation';
import { initMarquee } from './animations/Marquee';
import { initScrollLine } from './animations/ScrollLine';
import { initSmoothScroll } from './animations/SmoothScroll';
import { initAccessibleButtons } from './components/buttons/AccessibleButtons';
import { initFaqCards } from './components/cards/FaqCards';
import { initProductCards } from './components/cards/ProductCards';
import { initAccessibleDropdown } from './components/dropdown/AccessibleDropdown';
import { initNavAccessibility } from './components/layout/NavAccessibility';
import { initSmartNav } from './components/layout/SmartNav';
import { initMegaMenuAccordion } from './components/menu/MegaMenuAccordion';
import { initMobileNavScroll } from './components/menu/MobileNavScroll';
import { initProductsModal } from './components/modal/ProductsModal';
import { initDockSliders } from './components/sliders/DockSlider';
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
  initNavAccessibility();
  initSmartNav();
  initMegaMenuAccordion();
  initMobileNavScroll();
  initFaqCards();
  initProductCards();

  initSwiperSlider();
  initMobileSliders();
  initDockSliders();
  // initCustomCursor();
  initScrollLine();
  initAccessibleDropdown();
  initAccessibleButtons();
  initMarquee();
  initBlobAnimation();
  initProductsModal();
});
