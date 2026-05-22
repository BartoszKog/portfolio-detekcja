import './style.css';
import { MapController } from './map/MapController';
import { setupLayerToggle } from './ui/LayerToggle';

/**
 * Orthophotomaps are delivered as compressed WMTS tiles by the MSIP service,
 * which reduces bandwidth compared to the raw GeoTIFF rasters used for model training.
 */
new MapController({
  container: 'map',
  onLoad: () => {
    const panel = document.querySelector<HTMLElement>('#ui-panel');
    if (panel) {
      setupLayerToggle(panel);
    }
  },
});
