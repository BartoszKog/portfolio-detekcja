/**
 * Scrolls so the vertical center of an element aligns with the viewport center.
 */
export function scrollElementCenterIntoView(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const elementCenterY = rect.top + window.scrollY + rect.height / 2;
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  const targetScrollY = Math.max(
    0,
    Math.min(maxScrollY, elementCenterY - window.innerHeight / 2),
  );

  window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
}
