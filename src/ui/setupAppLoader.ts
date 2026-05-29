/**
 * Reveals the styled app and fades out the initial loading overlay.
 * Call after CSS and synchronous UI setup are complete.
 */
export function revealApp(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add('app-ready');
    });
  });
}
