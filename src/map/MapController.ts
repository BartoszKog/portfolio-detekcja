import maplibregl, { type Map } from 'maplibre-gl';

export interface MapControllerConfig {
  container: string | HTMLElement;
}

const CARTO_POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const KRAKOW_CENTER: [number, number] = [19.9449, 50.0646];
const INITIAL_ZOOM = 13;

/** Hides city, district, and other place name labels from the CARTO basemap. */
function hidePlaceNameLabels(map: Map): void {
  const layers = map.getStyle()?.layers;
  if (!layers) {
    return;
  }

  for (const layer of layers) {
    if (layer.id.startsWith('place_')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
  }
}

/** Initializes and manages the MapLibre map instance. */
export class MapController {
  private readonly map: Map;

  constructor(config: MapControllerConfig) {
    this.map = new maplibregl.Map({
      container: config.container,
      style: CARTO_POSITRON_STYLE,
      center: KRAKOW_CENTER,
      zoom: INITIAL_ZOOM,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.once('load', () => {
      hidePlaceNameLabels(this.map);
    });
  }

  getMap(): Map {
    return this.map;
  }
}
