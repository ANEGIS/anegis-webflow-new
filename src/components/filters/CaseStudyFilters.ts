/**
 * Case Study Filters
 *
 * Custom filtering for the case study collection list powered by
 * Finsweet Attributes v2 List API.
 *
 * Radio filters — grouped by `name` attribute (obszary, rozwiazania, branze).
 * Each radio's `.checkbox_text` label matches text inside the corresponding
 * `[fs-list-nest="<group>"]` nested list within each item's `.for-filters` div.
 *
 * Integration:
 *   - Hooks into Finsweet's `filter` lifecycle phase via `addHook('filter', ...)`
 *   - Triggers re-filtering with `triggerHook('filter')` on user interaction
 *   - Awaits `loadingPaginatedItems` so ALL items are available before filtering
 *   - Awaits each item's `nesting` promise so nested content is ready
 *   - Cross-group faceted search: removes radios that would produce no results
 *   - Disables dropdown when all its radios are hidden (no possible matches)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadioState {
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
  dropdownWrappers.forEach((el) => el.classList.add('cs-filters-loading'));

  function removeLoadingState() {
    dropdownWrappers.forEach((el) => el.classList.remove('cs-filters-loading'));
    loadingStyle.remove();
  }

  // ---- Gather filter UI elements ----
  const FILTER_GROUPS = ['obszary', 'rozwiazania', 'branze'] as const;

  // Build radio state
  const radios: RadioState[] = [];

  FILTER_GROUPS.forEach((group) => {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${group}"]`
    );
    inputs.forEach((input) => {
      const wrapperEl = input.closest('[role="listitem"]') as HTMLElement | null;
      const textEl =
        (wrapperEl ?? input.parentElement)?.querySelector<HTMLElement>('.checkbox_text') ?? null;
      const label = textEl?.textContent?.trim() ?? '';
      const parentEl = wrapperEl?.parentElement ?? null;
      const nextSiblingEl = wrapperEl?.nextSibling ?? null;
      radios.push({ group, label, input, textEl, wrapperEl, parentEl, nextSiblingEl });
    });
  });

  // ---- Dropdown references & toggle labels (show picked option in toggle) ----
  const groupDropdowns = new Map<
    string,
    { wrapperEl: HTMLElement; toggleTextEl: HTMLElement; defaultText: string }
  >();

  FILTER_GROUPS.forEach((group) => {
    // Radios are still in the DOM at this point, so .closest() works
    const firstRadio = radios.find((r) => r.group === group);
    if (!firstRadio) return;

    const wrapperEl = firstRadio.input.closest('.dropdown_wrapper') as HTMLElement | null;
    if (!wrapperEl) return;

    const toggleTextEl = wrapperEl.querySelector<HTMLElement>('.form_dropdown > div:first-child');
    if (!toggleTextEl) return;

    groupDropdowns.set(group, {
      wrapperEl,
      toggleTextEl,
      defaultText: toggleTextEl.textContent?.trim() ?? '',
    });
  });

  function updateToggleLabel(group: string) {
    const dropdown = groupDropdowns.get(group);
    if (!dropdown) return;

    const activeLabel = activeFilters.get(group);
    if (activeLabel && activeLabel.size > 0) {
      const [first] = activeLabel;
      dropdown.toggleTextEl.textContent = first;
    } else {
      dropdown.toggleTextEl.textContent = dropdown.defaultText;
    }
  }

  // ---- Active filter state ----
  const activeFilters: Map<string, Set<string>> = new Map(
    FILTER_GROUPS.map((g) => [g, new Set<string>()])
  );

  function hasActiveFilters(): boolean {
    for (const labels of activeFilters.values()) {
      if (labels.size > 0) return true;
    }
    return false;
  }

  // ---- Filter logic (operates on item DOM elements) ----

  function passesRadioFilters(el: HTMLElement): boolean {
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

      // Stable snapshot of ALL items — captured before any hooks run.
      // Used by updateRadioAvailability so it always works against the full
      // item set, regardless of which other hooks (e.g. search) run first.
      const allLoadedItems = listInstance.items.value.slice();

      // ✅ Everything loaded — remove loading state
      removeLoadingState();

      // ---- Empty state element ----
      const emptyEl = document.querySelector<HTMLElement>('[data-empty]');
      if (emptyEl) emptyEl.style.display = 'none';

      function updateEmptyState(resultCount: number, filtersActive: boolean) {
        if (!emptyEl) return;
        emptyEl.style.display = filtersActive && resultCount === 0 ? 'flex' : 'none';
      }

      // ---- Cross-group radio availability (faceted search) ----
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

      function updateRadioAvailability() {
        for (const group of FILTER_GROUPS) {
          const groupRadios = radios.filter((r) => r.group === group);

          // If items on this page don't use fs-list-nest for this group,
          // skip availability logic entirely — radios would all appear to have
          // no matches, causing the dropdown to be incorrectly disabled.
          const groupUsesNesting = allLoadedItems.some((item) =>
            item.element.querySelector(
              `[fs-list-nest="${group}"][fs-list-element="nest-target"]`
            )
          );
          if (!groupUsesNesting) {
            groupDropdowns.get(group)?.wrapperEl.classList.remove('is-disabled');
            continue;
          }

          // Get items that pass all filters EXCEPT this group
          const itemsPassingOtherGroups = allLoadedItems.filter((item) => {
            const el = item.element;

            for (const [otherGroup, labels] of activeFilters.entries()) {
              if (otherGroup === group) continue;
              if (!passesGroupFilter(el, otherGroup, labels)) return false;
            }

            return true;
          });

          // Track how many radios remain visible in this group
          let visibleCount = 0;

          // For each radio in this group, check availability
          for (const r of groupRadios) {
            if (!r.wrapperEl || !r.parentEl) continue;

            if (r.input.checked) {
              // Already checked — always keep in DOM
              if (!r.wrapperEl.parentElement) {
                if (r.nextSiblingEl && r.nextSiblingEl.parentElement === r.parentEl) {
                  r.parentEl.insertBefore(r.wrapperEl, r.nextSiblingEl);
                } else {
                  r.parentEl.appendChild(r.wrapperEl);
                }
              }
              visibleCount++;
              continue;
            }

            const hasMatchingItems = itemsPassingOtherGroups.some((item) => {
              const texts = getItemNestTexts(item.element, group);
              return texts.some((text) => text === r.label.toLowerCase());
            });

            if (hasMatchingItems) {
              if (!r.wrapperEl.parentElement) {
                if (r.nextSiblingEl && r.nextSiblingEl.parentElement === r.parentEl) {
                  r.parentEl.insertBefore(r.wrapperEl, r.nextSiblingEl);
                } else {
                  r.parentEl.appendChild(r.wrapperEl);
                }
              }
              visibleCount++;
            } else {
              if (r.wrapperEl.parentElement) {
                r.wrapperEl.remove();
              }
            }
          }

          // Disable the dropdown when no radios are visible in this group
          const dropdown = groupDropdowns.get(group);
          if (dropdown) {
            if (visibleCount === 0) {
              dropdown.wrapperEl.classList.add('is-disabled');

              // Force-close the Webflow dropdown if it's currently open
              const toggle = dropdown.wrapperEl.querySelector<HTMLElement>('.w-dropdown-toggle');
              const list = dropdown.wrapperEl.querySelector<HTMLElement>('.w-dropdown-list');
              toggle?.classList.remove('w--open');
              toggle?.setAttribute('aria-expanded', 'false');
              list?.classList.remove('w--open');
            } else {
              dropdown.wrapperEl.classList.remove('is-disabled');
            }
          }
        }
      }

      // ---- Register our custom filter hook ----
      listInstance.addHook('filter', (items: FsListItem[]) => {
        if (!hasActiveFilters()) {
          updateEmptyState(items.length, false);
          updateRadioAvailability();
          return items;
        }

        const filtered = items.filter((item) => {
          const el = item.element;
          return passesRadioFilters(el);
        });

        updateEmptyState(filtered.length, true);
        updateRadioAvailability();

        return filtered;
      });

      // ---- Radio handlers ----
      radios.forEach((r) => {
        r.input.addEventListener('click', () => {
          const filterSet = activeFilters.get(r.group);
          if (!filterSet) return;

          // Toggle off if clicking the already-selected radio
          if (filterSet.has(r.label)) {
            r.input.checked = false;
            filterSet.clear();
            r.textEl?.classList.remove('is-active');
          } else {
            // Clear previous selection in this group
            filterSet.clear();
            radios
              .filter((other) => other.group === r.group && other !== r)
              .forEach((other) => other.textEl?.classList.remove('is-active'));

            filterSet.add(r.label);
            r.textEl?.classList.add('is-active');
          }

          updateToggleLabel(r.group);

          listInstance.triggerHook('filter');
        });
      });

      // ---- Handle pre-checked radios ----
      let hasPresetFilters = false;
      radios.forEach((r) => {
        if (r.input.checked) {
          const filterSet = activeFilters.get(r.group);
          if (filterSet) {
            filterSet.add(r.label);
            r.textEl?.classList.add('is-active');
            hasPresetFilters = true;
          }
        }
      });

      if (hasPresetFilters) {
        listInstance.triggerHook('filter');
      }
    },
  ]);
}
