/**
 * Case Study Filters
 *
 * Custom filtering for the case study collection list powered by
 * Finsweet Attributes v2 List API.
 *
 * Two filter groups:
 *
 * 1. Checkbox filters — grouped by `name` attribute (obszary, rozwiazania, branze).
 *    Each checkbox's `.checkbox_text` label matches text inside the corresponding
 *    `[fs-list-nest="<group>"]` nested list within each item's `.for-filters` div.
 *
 * 2. Search bar — `[data-search="name"]` input filters items by text content
 *    of `[data-filter="name"]` inside each item.
 *
 * Integration:
 *   - Hooks into Finsweet's `filter` lifecycle phase via `addHook('filter', ...)`
 *   - Triggers re-filtering with `triggerHook('filter')` on user interaction
 *   - Awaits `loadingPaginatedItems` so ALL items are available before filtering
 *   - Awaits each item's `nesting` promise so nested content is ready
 *   - Cross-group faceted search: removes checkboxes that would produce no results
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckboxState {
  group: string;
  label: string;
  input: HTMLInputElement;
  textEl: HTMLElement | null;
  wrapperEl: HTMLElement | null;
  parentEl: HTMLElement | null;
  nextSiblingEl: Node | null;
}

interface FsListItem {
  id: string;
  element: HTMLElement;
  fields: Record<string, { type: string; value: unknown; rawValue: unknown }>;
  nesting?: Promise<void>;
  currentIndex?: number;
  href?: string;
}

interface FsListInstance {
  items: { value: FsListItem[] };
  currentPage: { value: number };
  totalPages: { value: number };
  itemsPerPage: { value: number };
  loadingPaginatedItems?: Promise<void>;
  listElement: HTMLElement | null;
  wrapperElement: HTMLElement;
  addHook: (
    key: string,
    callback: (items: FsListItem[]) => FsListItem[] | Promise<FsListItem[]>
  ) => void;
  triggerHook: (key: string) => void;
  watch: (source: () => unknown, callback: (...args: unknown[]) => void) => void;
  effect: (callback: () => void) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    FinsweetAttributes: [string, (instances: FsListInstance[]) => void][];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function initCaseStudyFilters() {
  // ---- Loading state: block interactions until Finsweet is ready ----
  const loadingStyle = document.createElement('style');
  loadingStyle.textContent = `
    @keyframes csFilterShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .cs-filters-loading {
      position: relative;
      pointer-events: none;
      opacity: 0.5;
    }
    .cs-filters-loading::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%);
      background-size: 200% 100%;
      animation: csFilterShimmer 1.8s ease-in-out infinite;
      border-radius: inherit;
      pointer-events: none;
    }
  `;
  document.head.appendChild(loadingStyle);

  // Apply loading state immediately to filter controls
  const dropdownWrappers = document.querySelectorAll<HTMLElement>('.dropdown_wrapper');
  const searchInput = document.querySelector<HTMLInputElement>('[data-search="name"]');

  dropdownWrappers.forEach((el) => el.classList.add('cs-filters-loading'));
  if (searchInput) {
    const searchWrapper = searchInput.closest('.form_field-wrapper') || searchInput.parentElement;
    if (searchWrapper) (searchWrapper as HTMLElement).classList.add('cs-filters-loading');
  }

  function removeLoadingState() {
    dropdownWrappers.forEach((el) => el.classList.remove('cs-filters-loading'));
    if (searchInput) {
      const searchWrapper = searchInput.closest('.form_field-wrapper') || searchInput.parentElement;
      if (searchWrapper) (searchWrapper as HTMLElement).classList.remove('cs-filters-loading');
    }
    loadingStyle.remove();
  }

  // ---- Gather filter UI elements ----
  const FILTER_GROUPS = ['obszary', 'rozwiazania', 'branze'] as const;

  // Build checkbox state
  const checkboxes: CheckboxState[] = [];

  FILTER_GROUPS.forEach((group) => {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      `input[type="checkbox"][name="${group}"]`
    );
    inputs.forEach((input) => {
      const wrapperEl = input.closest('[role="listitem"]') as HTMLElement | null;
      const textEl =
        (wrapperEl ?? input.parentElement)?.querySelector<HTMLElement>('.checkbox_text') ?? null;
      const label = textEl?.textContent?.trim() ?? '';
      const parentEl = wrapperEl?.parentElement ?? null;
      const nextSiblingEl = wrapperEl?.nextSibling ?? null;
      checkboxes.push({ group, label, input, textEl, wrapperEl, parentEl, nextSiblingEl });
    });
  });

  // ---- Active filter state ----
  const activeFilters: Map<string, Set<string>> = new Map(
    FILTER_GROUPS.map((g) => [g, new Set<string>()])
  );
  let searchQuery = '';

  function hasActiveFilters(): boolean {
    for (const labels of activeFilters.values()) {
      if (labels.size > 0) return true;
    }
    return searchQuery.length > 0;
  }

  // ---- Filter logic (operates on item DOM elements) ----

  function passesCheckboxFilters(el: HTMLElement): boolean {
    for (const [group, labels] of activeFilters.entries()) {
      if (labels.size === 0) continue;

      const nestTarget = el.querySelector<HTMLElement>(
        `[fs-list-nest="${group}"][fs-list-element="nest-target"]`
      );

      if (!nestTarget) return false;

      const nestTexts = Array.from(
        nestTarget.querySelectorAll<HTMLElement>('[role="listitem"] div')
      ).map((div) => div.textContent?.trim().toLowerCase() ?? '');

      const hasMatch = Array.from(labels).some((label) =>
        nestTexts.some((text) => text === label.toLowerCase())
      );

      if (!hasMatch) return false;
    }

    return true;
  }

  function passesSearchFilter(el: HTMLElement): boolean {
    if (!searchQuery) return true;

    const nameEl = el.querySelector<HTMLElement>('[data-filter="name"]');
    if (!nameEl) return false;

    const text = nameEl.textContent?.trim().toLowerCase() ?? '';
    return text.includes(searchQuery);
  }

  // ---- Hook into Finsweet Attributes v2 List API ----
  window.FinsweetAttributes ||= [];
  window.FinsweetAttributes.push([
    'list',
    async (listInstances: FsListInstance[]) => {
      // Find the correct instance
      const listInstance =
        listInstances.find(
          (inst) =>
            inst.wrapperElement?.querySelector('[fs-list-element="list"]') ||
            inst.listElement?.hasAttribute('fs-list-element')
        ) || listInstances[0];

      if (!listInstance) {
        removeLoadingState();
        return;
      }

      // Wait for all paginated items to be loaded
      if (listInstance.loadingPaginatedItems) {
        await listInstance.loadingPaginatedItems;
      }

      // Wait for all nesting to complete
      const nestingPromises = listInstance.items.value
        .map((item) => item.nesting)
        .filter((p): p is Promise<void> => !!p);

      if (nestingPromises.length > 0) {
        await Promise.all(nestingPromises);
      }

      // ✅ Everything loaded — remove loading state
      removeLoadingState();

      // ---- Empty state element ----
      const emptyEl = document.querySelector<HTMLElement>('[data-empty]');
      if (emptyEl) emptyEl.style.display = 'none';

      function updateEmptyState(resultCount: number, filtersActive: boolean) {
        if (!emptyEl) return;
        emptyEl.style.display = filtersActive && resultCount === 0 ? 'flex' : 'none';
      }

      // ---- Cross-group checkbox availability (faceted search) ----
      function getItemNestTexts(el: HTMLElement, group: string): string[] {
        const nestTarget = el.querySelector<HTMLElement>(
          `[fs-list-nest="${group}"][fs-list-element="nest-target"]`
        );
        if (!nestTarget) return [];
        return Array.from(nestTarget.querySelectorAll<HTMLElement>('[role="listitem"] div')).map(
          (div) => div.textContent?.trim().toLowerCase() ?? ''
        );
      }

      function passesGroupFilter(el: HTMLElement, group: string, labels: Set<string>): boolean {
        if (labels.size === 0) return true;
        const texts = getItemNestTexts(el, group);
        return Array.from(labels).some((label) =>
          texts.some((text) => text === label.toLowerCase())
        );
      }

      function updateCheckboxAvailability() {
        const allItems = listInstance.items.value;

        for (const group of FILTER_GROUPS) {
          const groupCheckboxes = checkboxes.filter((cb) => cb.group === group);

          // Get items that pass all filters EXCEPT this group
          const itemsPassingOtherGroups = allItems.filter((item) => {
            const el = item.element;

            if (!passesSearchFilter(el)) return false;

            for (const [otherGroup, labels] of activeFilters.entries()) {
              if (otherGroup === group) continue;
              if (!passesGroupFilter(el, otherGroup, labels)) return false;
            }

            return true;
          });

          // For each checkbox in this group, check availability
          for (const cb of groupCheckboxes) {
            if (!cb.wrapperEl || !cb.parentEl) continue;

            if (cb.input.checked) {
              // Already checked — always keep in DOM
              if (!cb.wrapperEl.parentElement) {
                if (cb.nextSiblingEl && cb.nextSiblingEl.parentElement === cb.parentEl) {
                  cb.parentEl.insertBefore(cb.wrapperEl, cb.nextSiblingEl);
                } else {
                  cb.parentEl.appendChild(cb.wrapperEl);
                }
              }
              continue;
            }

            const hasMatchingItems = itemsPassingOtherGroups.some((item) => {
              const texts = getItemNestTexts(item.element, group);
              return texts.some((text) => text === cb.label.toLowerCase());
            });

            if (hasMatchingItems) {
              if (!cb.wrapperEl.parentElement) {
                if (cb.nextSiblingEl && cb.nextSiblingEl.parentElement === cb.parentEl) {
                  cb.parentEl.insertBefore(cb.wrapperEl, cb.nextSiblingEl);
                } else {
                  cb.parentEl.appendChild(cb.wrapperEl);
                }
              }
            } else {
              if (cb.wrapperEl.parentElement) {
                cb.wrapperEl.remove();
              }
            }
          }
        }
      }

      // ---- Register our custom filter hook ----
      listInstance.addHook('filter', (items: FsListItem[]) => {
        if (!hasActiveFilters()) {
          updateEmptyState(items.length, false);
          updateCheckboxAvailability();
          return items;
        }

        const filtered = items.filter((item) => {
          const el = item.element;
          return passesCheckboxFilters(el) && passesSearchFilter(el);
        });

        updateEmptyState(filtered.length, true);
        updateCheckboxAvailability();

        return filtered;
      });

      // ---- Checkbox handlers ----
      checkboxes.forEach((cb) => {
        cb.input.addEventListener('change', () => {
          const filterSet = activeFilters.get(cb.group);
          if (!filterSet) return;

          if (cb.input.checked) {
            filterSet.add(cb.label);
            cb.textEl?.classList.add('is-active');
          } else {
            filterSet.delete(cb.label);
            cb.textEl?.classList.remove('is-active');
          }

          listInstance.triggerHook('filter');
        });
      });

      // ---- Dropdown wrappers (disabled while searching) ----

      function updateDropdownState() {
        dropdownWrappers.forEach((el) => {
          if (searchQuery.length > 0) {
            el.classList.add('is-disabled');
          } else {
            el.classList.remove('is-disabled');
          }
        });
      }

      // ---- Search handler ----
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          searchQuery = searchInput.value.trim().toLowerCase();
          updateDropdownState();

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            listInstance.triggerHook('filter');
          }, 300);
        });
      }

      // ---- Handle pre-checked checkboxes ----
      let hasPresetFilters = false;
      checkboxes.forEach((cb) => {
        if (cb.input.checked) {
          const filterSet = activeFilters.get(cb.group);
          if (filterSet) {
            filterSet.add(cb.label);
            cb.textEl?.classList.add('is-active');
            hasPresetFilters = true;
          }
        }
      });

      if (searchInput && searchInput.value.trim()) {
        searchQuery = searchInput.value.trim().toLowerCase();
        hasPresetFilters = true;
      }

      if (hasPresetFilters) {
        listInstance.triggerHook('filter');
      }
    },
  ]);
}
