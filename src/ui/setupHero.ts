import { scrollElementCenterIntoView } from '../utils/scrollElementCenterIntoView';

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
