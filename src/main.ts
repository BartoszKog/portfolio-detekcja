import './style.css';
import { MapController } from './map/MapController';
import { setupLegend } from './ui/Legend';
import { setupLayerToggle } from './ui/LayerToggle';
import { setupScaleLine } from './ui/ScaleLine';

/**
 * Orthophotomaps are delivered as compressed WMTS tiles by the MSIP service,
 * which reduces bandwidth compared to the raw GeoTIFF rasters used for model training.
 */
const mapController = new MapController({
  container: 'map',
  onLoad: () => {
    setupScaleLine(mapController.getMap());

    const app = document.querySelector<HTMLElement>('#app');
    if (app) {
      setupLegend(app);
    }

    const panel = document.querySelector<HTMLElement>('#ui-panel');
    if (panel) {
      setupLayerToggle(panel);
    }
  },
});
