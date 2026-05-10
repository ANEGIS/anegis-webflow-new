function observeFormSuccess(form: HTMLFormElement, pdfUrl: string) {
  const formWrapper = form.closest<HTMLElement>('.w-form');
  const successPanel = formWrapper && formWrapper.querySelector<HTMLElement>('.w-form-done');

  if (!successPanel) {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const observer = new MutationObserver(function (_, obs) {
    const style = window.getComputedStyle(successPanel);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      obs.disconnect();
    }
  });

  observer.observe(formWrapper, {
    attributes: true,
    attributeFilter: ['style', 'class'],
    subtree: true,
  });
}

export function initEbookDownload() {
  const form = document.getElementById('wf-form-ebook') as HTMLFormElement | null;
  if (!form) return;

  const downloadEl = document.querySelector<HTMLAnchorElement>('[data-download]');
  if (!downloadEl) return;

  const pdfUrl = downloadEl.getAttribute('href');
  if (!pdfUrl) return;

  downloadEl.parentNode?.removeChild(downloadEl);

  form.addEventListener('submit', function handleSubmit() {
    form.removeEventListener('submit', handleSubmit);
    observeFormSuccess(form, pdfUrl);
  });
}
