export function initChallengeList() {
  const challengeList = document.querySelector('[data-challenge-list]');
  const headingCard = document.querySelector('[data-heading-card]');
  const ctaCard = document.querySelector('[data-cta-card]');

  if (challengeList && headingCard) {
    challengeList.insertAdjacentElement('afterbegin', headingCard);
  }

  if (challengeList && ctaCard) {
    challengeList.insertAdjacentElement('beforeend', ctaCard);
  }
}
