import type Map from 'ol/Map';

const CURSOR_MOVE = 'move';

function getMapCanvas(map: Map): HTMLCanvasElement | null {
  const canvas = map.getViewport().querySelector('canvas');
  return canvas instanceof HTMLCanvasElement ? canvas : null;
}

/** Shows the move cursor only while dragging the map. */
export function setupMapPanCursor(map: Map): void {
  const canvas = getMapCanvas(map);
  if (!canvas) {
    return;
  }

  map.on('pointerdrag', () => {
    canvas.style.cursor = CURSOR_MOVE;
  });

  const resetCursor = (): void => {
    canvas.style.cursor = '';
  };

  window.addEventListener('pointerup', resetCursor);
  window.addEventListener('pointercancel', resetCursor);
}
