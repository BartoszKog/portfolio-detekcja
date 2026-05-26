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

    const legendPanel = document.querySelector<HTMLElement>('#legend-panel');
    const legendToggle = document.querySelector<HTMLButtonElement>('#legend-toggle');
    if (legendPanel && legendToggle) {
      setupLegend(legendPanel, legendToggle);
    }

    const panel = document.querySelector<HTMLElement>('#ui-panel');
    const layerOptionsPanel = document.querySelector<HTMLElement>('#layer-options-panel');
    const layerOptionsToggle = document.querySelector<HTMLButtonElement>(
      '#layer-options-toggle',
    );
    if (panel && layerOptionsPanel && layerOptionsToggle) {
      setupLayerToggle(panel, layerOptionsPanel, layerOptionsToggle);
    }
  },
});
