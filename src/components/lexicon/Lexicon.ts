export const initLexicon = async () => {
  const cmsWrapper = document.querySelector('[data-lex-cms]');
  const templateBox = document.querySelector('[data-lex-box]');

  if (!cmsWrapper || !templateBox) {
    return;
  }

  const targetWrapper = templateBox.parentElement;
  if (!targetWrapper) {
    return;
  }

  let items = Array.from(cmsWrapper.querySelectorAll('.lex-list-item')) as HTMLAnchorElement[];

  // Fetch all paginated items if native Webflow pagination is present
  let nextUrl = cmsWrapper.querySelector('.w-pagination-next')?.getAttribute('href');

  const skeletons: HTMLElement[] = [];
  if (nextUrl) {
    templateBox.setAttribute('style', 'display: none !important;');
    if (!document.getElementById('lex-skeleton-style')) {
      const style = document.createElement('style');
      style.id = 'lex-skeleton-style';
      style.innerHTML = `
        .lex-skeleton {
          animation: lexPulse 1.5s ease-in-out infinite;
          pointer-events: none;
        }
        .lex-skeleton .lex-header {
          color: transparent !important;
          background-color: currentColor;
          opacity: 0.1;
          border-radius: 4px;
          display: inline-block;
          width: 3rem;
        }
        .lex-skeleton .lex-list-item {
          color: transparent !important;
          background-color: currentColor;
          opacity: 0.05;
          border-radius: 4px;
          width: 70%;
          display: block;
          margin-bottom: 0.5rem;
        }
        .lex-skeleton .lex-list-item:nth-child(even) {
          width: 50%;
        }
        @keyframes lexPulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `;
      document.head.appendChild(style);
    }

    // Create 3 skeleton boxes
    for (let i = 0; i < 3; i++) {
      const skeleton = templateBox.cloneNode(true) as HTMLElement;
      skeleton.classList.add('lex-skeleton');
      skeleton.removeAttribute('style');

      const listWrapper = skeleton.querySelector('[data-lex-list-wrapper]');
      if (listWrapper) {
        const itemTemplate = listWrapper.querySelector('.lex-list-item');
        if (itemTemplate) {
          listWrapper.innerHTML = '';
          for (let j = 0; j < 4; j++) {
            listWrapper.appendChild(itemTemplate.cloneNode(true));
          }
        }
      }
      targetWrapper.appendChild(skeleton);
      skeletons.push(skeleton);
    }
  }

  while (nextUrl) {
    try {
      const response = await fetch(nextUrl);
      if (!response.ok) break;
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const nextCmsWrapper = doc.querySelector('[data-lex-cms]');
      if (!nextCmsWrapper) break;

      const nextItems = Array.from(
        nextCmsWrapper.querySelectorAll('.lex-list-item')
      ) as HTMLAnchorElement[];
      items = [...items, ...nextItems];

      nextUrl = nextCmsWrapper.querySelector('.w-pagination-next')?.getAttribute('href');
    } catch (error) {
      console.error('Error fetching paginated lexicon items:', error);
      break;
    }
  }

  // Clean up skeletons
  skeletons.forEach((s) => s.remove());
  templateBox.removeAttribute('style');

  if (items.length === 0) {
    return;
  }

  const normalizeChar = (char: string) => {
    return char
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toUpperCase();
  };

  const bucketPairs = [
    { label: 'A-B', letters: ['A', 'B'] },
    { label: 'C-D', letters: ['C', 'D'] },
    { label: 'E-F', letters: ['E', 'F'] },
    { label: 'G-H', letters: ['G', 'H'] },
    { label: 'I-J', letters: ['I', 'J'] },
    { label: 'K-L', letters: ['K', 'L'] },
    { label: 'M-N', letters: ['M', 'N'] },
    { label: 'O-P', letters: ['O', 'P'] },
    { label: 'Q-R', letters: ['Q', 'R'] },
    { label: 'S-T', letters: ['S', 'T'] },
    { label: 'U-V', letters: ['U', 'V'] },
    { label: 'W-X', letters: ['W', 'X'] },
    { label: 'Y-Z', letters: ['Y', 'Z'] },
  ];

  // Find the exact item template inside the layout so we can clone it
  const templateListWrapper = templateBox.querySelector('[data-lex-list-wrapper]');
  const templateItemNode = templateListWrapper?.firstElementChild as HTMLElement;

  if (!templateItemNode) return;

  interface LexData {
    text: string;
    href: string;
  }

  const groupedItems = new Map<string, LexData[]>();
  bucketPairs.forEach((bucket) => {
    groupedItems.set(bucket.label, []);
  });
  const fallbackLabel = '0-9'; // Or "#"
  groupedItems.set(fallbackLabel, []);

  items.forEach((item) => {
    const text = item.textContent?.trim() || '';
    if (!text) return;

    const firstChar = normalizeChar(text.charAt(0));
    let assignedLabel = fallbackLabel;

    for (const bucket of bucketPairs) {
      if (bucket.letters.includes(firstChar)) {
        assignedLabel = bucket.label;
        break;
      }
    }

    // Extract exact href from the CMS item or its closest wrapping anchor
    const originAnchor = item.tagName === 'A' ? item : item.closest('a');
    const href = originAnchor?.getAttribute('href') || '#';

    groupedItems.get(assignedLabel)?.push({ text, href });
  });

  // Save the template and remove it from the DOM
  const boxTemplate = templateBox.cloneNode(true) as HTMLElement;
  templateBox.remove();

  // Populate new grouped boxes
  groupedItems.forEach((bucketItems, label) => {
    if (bucketItems.length === 0) return;

    // Sort items alphabetically within the bucket
    bucketItems.sort((a, b) => {
      const textA = a.text;
      const textB = b.text;
      return textA.localeCompare(textB, 'pl');
    });

    const newBox = boxTemplate.cloneNode(true) as HTMLElement;
    const header = newBox.querySelector('.lex-header');
    const listWrapper = newBox.querySelector('[data-lex-list-wrapper]');

    if (header) {
      header.textContent = label;
    }

    if (listWrapper) {
      listWrapper.innerHTML = '';
      bucketItems.forEach((data) => {
        const newItem = templateItemNode.cloneNode(true) as HTMLElement;
        newItem.textContent = data.text;

        if (newItem.tagName === 'A') {
          (newItem as HTMLAnchorElement).setAttribute('href', data.href);
        } else {
          const innerAnchor = newItem.querySelector('a');
          if (innerAnchor) {
            innerAnchor.setAttribute('href', data.href);
          } else {
            const closestAnchor = newItem.closest('a');
            if (closestAnchor) closestAnchor.setAttribute('href', data.href);
          }
        }

        listWrapper.appendChild(newItem);
      });
    }

    targetWrapper.appendChild(newBox);
  });

  // --- Search Logic ---
  const searchInput = document.querySelector<HTMLInputElement>("[data-search='lex']");
  const clearBox = document.querySelector<HTMLElement>('.clearbox');

  function updateClearBoxVisibility() {
    if (!clearBox) return;
    clearBox.style.display = searchInput && searchInput.value.trim() !== '' ? 'flex' : 'none';
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
      const normalizedSearch = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      const allBoxes = targetWrapper.querySelectorAll('[data-lex-box]');
      let anyBoxVisible = false;

      allBoxes.forEach((box) => {
        let hasVisibleItems = false;
        const listItems = box.querySelectorAll('.lex-list-item');

        listItems.forEach((item) => {
          const text = item.textContent?.toLowerCase() || '';
          const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

          if (normalizedText.includes(normalizedSearch)) {
            (item as HTMLElement).style.display = '';
            hasVisibleItems = true;
          } else {
            (item as HTMLElement).style.display = 'none';
          }
        });

        if (hasVisibleItems) {
          (box as HTMLElement).style.display = '';
          anyBoxVisible = true;
        } else {
          (box as HTMLElement).style.display = 'none';
        }
      });

      const emptyState = document.querySelector<HTMLElement>('[data-empty]');
      if (emptyState) {
        if (!anyBoxVisible) {
          emptyState.style.display = 'flex';
        } else {
          emptyState.style.display = 'none';
        }
      }

      updateClearBoxVisibility();
    });
  }

  // --- Clear-all button (.clearbox) ---
  if (clearBox) {
    clearBox.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      updateClearBoxVisibility();
    });
  }

  updateClearBoxVisibility();
};
