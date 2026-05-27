/**
 * Scrolls so the vertical center of an element aligns with the viewport center.
 */
function scrollElementCenterIntoView(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const elementCenterY = rect.top + window.scrollY + rect.height / 2;
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  const targetScrollY = Math.max(
    0,
    Math.min(maxScrollY, elementCenterY - window.innerHeight / 2),
  );

  window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
}

/**
 * Wires the hero scroll-to-map CTA.
 */
export function setupHero(): void {
  const scrollButton = document.querySelector<HTMLButtonElement>('#hero-scroll-to-map');
  const mapApp = document.querySelector<HTMLElement>('#app');

  scrollButton?.addEventListener('click', () => {
    if (!mapApp) {
      return;
    }

    scrollElementCenterIntoView(mapApp);
  });
}
