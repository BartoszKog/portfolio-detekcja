import type Map from 'ol/Map';
import { getPointResolution } from 'ol/proj';

const MIN_BAR_WIDTH = 80;
const MAX_BAR_WIDTH = 140;

/** Picks a readable round metric distance for the scale bar. */
function getNiceMetricDistance(maxDistance: number): number {
  const powerOfTen = 10 ** Math.floor(Math.log10(maxDistance));
  const normalized = maxDistance / powerOfTen;

  if (normalized < 2) {
    return powerOfTen;
  }

  if (normalized < 5) {
    return 2 * powerOfTen;
  }

  return 5 * powerOfTen;
}

/** Formats a metric distance for the scale label. */
function formatMetricDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    const kilometers = distanceMeters / 1000;
    return Number.isInteger(kilometers) ? `${kilometers} km` : `${kilometers.toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

/** Injects a minimal linear scale bar with end ticks and distance label. */
export function setupScaleLine(map: Map): void {
  const container = document.createElement('div');
  container.className = 'map-scale-line';

  const label = document.createElement('span');
  label.className = 'map-scale-line-label';

  const bar = document.createElement('div');
  bar.className = 'map-scale-line-bar';

  container.append(label, bar);
  map.getViewport().appendChild(container);

  const updateScaleBar = (): void => {
    const view = map.getView();
    const center = view.getCenter();
    const resolution = view.getResolution();
    const projection = view.getProjection();

    if (!center || resolution === undefined || !projection) {
      return;
    }

    const pointResolution = getPointResolution(projection, resolution, center, 'm');
    const maxDistance = MAX_BAR_WIDTH * pointResolution;
    const distance = getNiceMetricDistance(maxDistance);
    const width = Math.round(distance / pointResolution);
    const barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, width));
    const labelText = formatMetricDistance(distance);

    bar.style.width = `${barWidth}px`;
    label.textContent = labelText;
    container.setAttribute('aria-label', `Skala mapy: ${labelText}`);
  };

  updateScaleBar();
  map.getView().on('change:resolution', updateScaleBar);
  map.getView().on('change:center', updateScaleBar);
}
