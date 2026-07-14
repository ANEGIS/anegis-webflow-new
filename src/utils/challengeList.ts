export function initChallengeList() {
  const challengeLists = document.querySelectorAll<HTMLElement>('[data-challenge-list]');

  challengeLists.forEach((challengeList) => {
    // Scope lookups to the section wrapping this list, so multiple
    // instances on one page don't steal each other's cards
    let scope: HTMLElement | null = challengeList.parentElement;
    while (scope && !scope.querySelector('[data-heading-card], [data-cta-card]')) {
      scope = scope.parentElement;
    }
    if (!scope) return;

    const headingCard = scope.querySelector<HTMLElement>('[data-heading-card]');
    const ctaCard = scope.querySelector<HTMLElement>('[data-cta-card]');

    if (headingCard && !headingCard.contains(challengeList)) {
      challengeList.insertAdjacentElement('afterbegin', headingCard);
    }

    if (ctaCard && !ctaCard.contains(challengeList)) {
      challengeList.insertAdjacentElement('beforeend', ctaCard);
    }
  });
}
