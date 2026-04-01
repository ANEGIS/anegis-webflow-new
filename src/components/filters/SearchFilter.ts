/**
 * Universal Name Search Filter
 *
 * For every [data-search='name'] input on the page, finds the associated
 * Finsweet list instance and filters ALL items (across pages) by their <h3>
 * text content via addHook('filter', ...) so it composes with other filters.
 *
 * List discovery order:
 *   1. [data-search-target="<id>"] on the input → element with that id
 *   2. Walk up the DOM to find an ancestor that contains [fs-list-element="list"]
 *   3. Fallback: first list instance
 */

interface FsListItem {
  element: HTMLElement;
}

interface FsListInstance {
  items: { value: FsListItem[] };
  loadingPaginatedItems?: Promise<void>;
  listElement: HTMLElement | null;
  wrapperElement: HTMLElement;
  addHook: (
    key: string,
    callback: (items: FsListItem[]) => FsListItem[] | Promise<FsListItem[]>
  ) => void;
  triggerHook: (key: string) => void;
}

declare global {
  interface Window {
    FinsweetAttributes: [string, (instances: FsListInstance[]) => void][];
  }
}

function findListElement(input: HTMLElement): HTMLElement | null {
  const targetId = input.dataset.searchTarget;
  if (targetId) {
    return document.getElementById(targetId);
  }

  let node: HTMLElement | null = input.parentElement;
  while (node) {
    const list = node.querySelector<HTMLElement>('[fs-list-element="list"]');
    if (list) return list;
    node = node.parentElement;
  }

  return document.querySelector<HTMLElement>('[fs-list-element="list"]');
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L');
}

export function initSearchFilter() {
  const inputs = document.querySelectorAll<HTMLInputElement>("[data-search='name']");
  if (!inputs.length) return;

  window.FinsweetAttributes ||= [];
  window.FinsweetAttributes.push([
    'list',
    async (listInstances: FsListInstance[]) => {
      for (const input of Array.from(inputs)) {
        const listEl = findListElement(input);

        const listInstance =
          listInstances.find(
            (inst) =>
              (listEl && inst.wrapperElement?.contains(listEl)) ||
              inst.listElement === listEl
          ) || listInstances[0];

        if (!listInstance) continue;

        if (listInstance.loadingPaginatedItems) {
          await listInstance.loadingPaginatedItems;
        }

        listInstance.addHook('filter', (items: FsListItem[]) => {
          const term = normalize(input.value.trim());
          if (!term) return items;

          return items.filter((item) => {
            const h3 = item.element.querySelector<HTMLElement>('h3');
            return normalize(h3?.textContent ?? '').includes(term);
          });
        });

        const emptyEl =
          listInstance.wrapperElement?.querySelector<HTMLElement>('[data-empty]') ??
          document.querySelector<HTMLElement>('[data-empty]');

        input.addEventListener('input', () => {
          listInstance.triggerHook('filter');

          if (emptyEl) {
            const term = normalize(input.value.trim());
            const visibleItems = listInstance.items.value.filter((item) => {
              const h3 = item.element.querySelector<HTMLElement>('h3');
              return normalize(h3?.textContent ?? '').includes(term);
            });
            emptyEl.style.display = term && visibleItems.length === 0 ? 'flex' : 'none';
          }
        });
      }
    },
  ]);
}
