export class TabsAutomatic {
  tablistNode: HTMLElement;
  tabs: HTMLElement[] = [];
  firstTab: HTMLElement | null = null;
  lastTab: HTMLElement | null = null;
  tabpanels: HTMLElement[] = [];

  constructor(groupNode: HTMLElement) {
    this.tablistNode = groupNode;
    const orientation = this.tablistNode.getAttribute('data-orientation') || 'horizontal';
    this.tablistNode.setAttribute('aria-orientation', orientation);
    this.tabs = Array.from(this.tablistNode.querySelectorAll('[role=tab]'));

    this.tabs.forEach((tab) => {
      const controls = tab.getAttribute('aria-controls');
      if (!controls) return;

      const tabpanel = document.getElementById(controls);
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;

      if (tabpanel) {
        tabpanel.setAttribute('role', 'tabpanel');
        tabpanel.setAttribute('aria-labelledby', tab.id);
        tabpanel.removeAttribute('tabindex');
        this.tabpanels.push(tabpanel);
      }

      tab.addEventListener('keydown', this.onKeydown.bind(this));
      tab.addEventListener('click', this.onClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tab;
      }
      this.lastTab = tab;
    });

    const initialTab =
      this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || this.firstTab;

    if (initialTab) {
      this.setSelectedTab(initialTab, false);
    }
  }

  setSelectedTab(currentTab: HTMLElement, setFocus: boolean = true) {
    this.tabs.forEach((tab) => {
      const controls = tab.getAttribute('aria-controls');
      const tabpanel = controls ? document.getElementById(controls) : null;

      if (currentTab === tab) {
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;
        tab.classList.add('is-active-tab');
        if (tabpanel) {
          tabpanel.classList.add('is-active-tab');
          tabpanel.removeAttribute('hidden');
          tabpanel.removeAttribute('style');
        }
        if (setFocus) {
          tab.focus();
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.tabIndex = -1;
        tab.classList.remove('is-active-tab');
        if (tabpanel) {
          tabpanel.classList.remove('is-active-tab');
          tabpanel.setAttribute('hidden', 'true');
          tabpanel.removeAttribute('style');
        }
      }
    });
  }

  setSelectedToPreviousTab(currentTab: HTMLElement) {
    if (currentTab === this.firstTab && this.lastTab) {
      this.setSelectedTab(this.lastTab);
    } else {
      const index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index - 1]);
    }
  }

  setSelectedToNextTab(currentTab: HTMLElement) {
    if (currentTab === this.lastTab && this.firstTab) {
      this.setSelectedTab(this.firstTab);
    } else {
      const index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index + 1]);
    }
  }

  onKeydown(event: KeyboardEvent) {
    const tgt = event.currentTarget as HTMLElement;
    let flag = false;
    const orientation = this.tablistNode.getAttribute('aria-orientation') || 'horizontal';

    switch (event.key) {
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          this.setSelectedToPreviousTab(tgt);
          flag = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          this.setSelectedToNextTab(tgt);
          flag = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          this.setSelectedToPreviousTab(tgt);
          flag = true;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          this.setSelectedToNextTab(tgt);
          flag = true;
        }
        break;
      case 'Home':
        if (this.firstTab) {
          this.setSelectedTab(this.firstTab);
          flag = true;
        }
        break;
      case 'End':
        if (this.lastTab) {
          this.setSelectedTab(this.lastTab);
          flag = true;
        }
        break;
      case 'Enter':
      case ' ':
        this.setSelectedTab(tgt);
        flag = true;
        break;
      default:
        break;
    }
    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event: MouseEvent) {
    this.setSelectedTab(event.currentTarget as HTMLElement);
  }
}

export function initTabLists() {
  const tabContainers = document.querySelectorAll('[data-module="tabs"]');
  tabContainers.forEach((container) => {
    const tablist = container.querySelector('[role="tablist"]');
    if (tablist instanceof HTMLElement) {
      if (container.hasAttribute('data-orientation') && !tablist.hasAttribute('data-orientation')) {
        const orientation = container.getAttribute('data-orientation');
        if (orientation) tablist.setAttribute('data-orientation', orientation);
      }
      new TabsAutomatic(tablist);
    }
  });

  const allStandaloneTablists = document.querySelectorAll('[role="tablist"]');
  allStandaloneTablists.forEach((tablist) => {
    if (tablist instanceof HTMLElement && !tablist.closest('[data-module="tabs"]')) {
      new TabsAutomatic(tablist);
    }
  });
}
