import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, get as getProjection, transformExtent } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import proj4 from 'proj4';

export interface MapControllerConfig {
  container: string | HTMLElement;
  onLoad?: () => void;
}

type OrthoYear = '2023' | '2025';

const KRAKOW_CENTER: [number, number] = [19.9449, 50.0646];
const INITIAL_ZOOM = 13;
const EPSG_2178 = 'EPSG:2178';
const EPSG_2178_PROJ =
  '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';
const MSIP_ATTRIBUTION = '© MSIP Kraków';
const CARTO_ATTRIBUTION = '© OpenStreetMap contributors © CARTO';
const MSIP_TILE_MATRIX_SET = 'default028mm';
const MSIP_TILE_ORIGIN: [number, number] = [1877300, 10001300];
const MSIP_TILE_SIZE = 512;
const MSIP_EXTENT_2178: [number, number, number, number] = [
  7410400, 5536000, 7445600, 5558000,
];
const MSIP_RESOLUTIONS = [
  66.1459656252646,
  52.91677250021167,
  26.458386250105836,
  13.229193125052918,
  6.614596562526459,
  2.6458386250105836,
  1.3229193125052918,
  0.6614596562526459,
  0.26458386250105836,
  0.13229193125052918,
] as const;
const MSIP_MATRIX_IDS = MSIP_RESOLUTIONS.map((_, index) => String(index));

interface OrthoLayerConfig {
  year: OrthoYear;
  url: string;
  layer: string;
  format: string;
  visible: boolean;
}

const ORTHO_LAYER_CONFIGS: readonly OrthoLayerConfig[] = [
  {
    year: '2023',
    url: 'https://msip.um.krakow.pl/image/rest/services/Mapy_bazowe/basemap_OFM_2023_OW_2024/MapServer/WMTS?',
    layer: 'Mapy_bazowe_basemap_OFM_2023_OW_2024',
    format: 'image/png',
    visible: false,
  },
  {
    year: '2025',
    url: 'https://msip3.um.krakow.pl/image/rest/services/Mapy_Bazowe/Ortofotomapa_2025_04_RGB_OW_gugik/ImageServer/WMTS?',
    layer: 'Mapy_Bazowe_Ortofotomapa_2025_04_RGB_OW_gugik',
    format: 'image/jpgpng',
    visible: true,
  },
] as const;

let mapInstance: Map | null = null;
const orthoLayers = new globalThis.Map<OrthoYear, TileLayer<WMTS>>();

proj4.defs(EPSG_2178, EPSG_2178_PROJ);
register(proj4);

const projection2178 = getProjection(EPSG_2178);
if (!projection2178) {
  throw new Error(`Projection ${EPSG_2178} is not registered.`);
}
projection2178.setExtent(MSIP_EXTENT_2178);

const msipExtent3857 = transformExtent(MSIP_EXTENT_2178, EPSG_2178, 'EPSG:3857');
const msipTileGrid = new WMTSTileGrid({
  extent: MSIP_EXTENT_2178,
  origin: MSIP_TILE_ORIGIN,
  resolutions: [...MSIP_RESOLUTIONS],
  matrixIds: MSIP_MATRIX_IDS,
  tileSize: MSIP_TILE_SIZE,
});

/** Shows one orthophoto year and hides the other. */
export function toggleLayer(year: OrthoYear): void {
  for (const [layerYear, layer] of orthoLayers) {
    layer.setVisible(layerYear === year);
  }
  mapInstance?.render();
}

/** Hides both MSIP orthophoto layers so only the basemap remains visible. */
export function hideOrthophotoLayers(): void {
  for (const layer of orthoLayers.values()) {
    layer.setVisible(false);
  }
  mapInstance?.render();
}

/** Ensures the map canvas matches its container dimensions. */
function setupMapResizeHandling(map: Map, container: string | HTMLElement): void {
  const resize = (): void => {
    map.updateSize();
  };

  requestAnimationFrame(resize);
  window.addEventListener('resize', resize);

  const element =
    typeof container === 'string' ? document.getElementById(container) : container;

  if (element) {
    new ResizeObserver(resize).observe(element);
  }
}

function createBasemapLayer(): TileLayer<XYZ> {
  return new TileLayer({
    source: new XYZ({
      url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      attributions: CARTO_ATTRIBUTION,
      crossOrigin: 'anonymous',
      maxZoom: 20,
    }),
  });
}

function createOrthophotoLayer(config: OrthoLayerConfig): TileLayer<WMTS> {
  const layer = new TileLayer({
    extent: msipExtent3857,
    visible: config.visible,
    source: new WMTS({
      url: config.url,
      layer: config.layer,
      matrixSet: MSIP_TILE_MATRIX_SET,
      format: config.format,
      projection: EPSG_2178,
      tileGrid: msipTileGrid,
      style: 'default',
      requestEncoding: 'KVP',
      crossOrigin: 'anonymous',
      attributions: MSIP_ATTRIBUTION,
      wrapX: false,
      transition: 0,
      zDirection: 0,
    }),
  });

  orthoLayers.set(config.year, layer);
  return layer;
}

/** Initializes and manages the OpenLayers map instance. */
export class MapController {
  private readonly map: Map;

  constructor(config: MapControllerConfig) {
    this.map = new Map({
      target: config.container,
      layers: [
        createBasemapLayer(),
        ...ORTHO_LAYER_CONFIGS.map((layerConfig) => createOrthophotoLayer(layerConfig)),
      ],
      view: new View({
        center: fromLonLat(KRAKOW_CENTER),
        zoom: INITIAL_ZOOM,
        maxZoom: 21,
      }),
    });

    mapInstance = this.map;

    setupMapResizeHandling(this.map, config.container);
    requestAnimationFrame(() => {
      this.map.updateSize();
      config.onLoad?.();
    });
  }

  getMap(): Map {
    return this.map;
  }
}
