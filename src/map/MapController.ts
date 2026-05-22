import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, get as getProjection, transformExtent } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import {
  createDetectionSource,
  EPSG_2178,
  registerDetectionProjections,
  type OrthoYear,
} from './detectionCoordinates';

export type { OrthoYear } from './detectionCoordinates';

export interface MapControllerConfig {
  container: string | HTMLElement;
  onLoad?: () => void;
}

const KRAKOW_CENTER: [number, number] = [19.9449, 50.0646];
const INITIAL_ZOOM = 14.5;
const DETECTION_MIN_ZOOM = 16;
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

interface DetectionLayerConfig {
  year: OrthoYear;
  url: string;
  visible: boolean;
}

const DETECTION_LAYER_CONFIGS: readonly DetectionLayerConfig[] = [
  {
    year: '2023',
    url: './data/detections_2023.geojson',
    visible: false,
  },
  {
    year: '2025',
    url: './data/detections_2025.geojson',
    visible: true,
  },
] as const;

let mapInstance: Map | null = null;
const orthoLayers = new globalThis.Map<OrthoYear, TileLayer<WMTS>>();
const detectionLayers = new globalThis.Map<OrthoYear, VectorLayer<VectorSource>>();

registerDetectionProjections();

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

/** Shows one orthophoto year and its detections while hiding the other year. */
export function toggleLayer(year: OrthoYear): void {
  for (const [layerYear, layer] of orthoLayers) {
    layer.setVisible(layerYear === year);
  }
  for (const [layerYear, layer] of detectionLayers) {
    layer.setVisible(layerYear === year);
  }
  mapInstance?.render();
}

/** Hides both MSIP orthophoto and detection layers so only the basemap remains visible. */
export function hideOrthophotoLayers(): void {
  for (const layer of orthoLayers.values()) {
    layer.setVisible(false);
  }
  for (const layer of detectionLayers.values()) {
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

const DETECTION_STYLES: Record<OrthoYear, { fill: string; stroke: string }> = {
  '2023': {
    fill: 'rgba(59, 130, 246, 0.85)',
    stroke: '#ffffff',
  },
  '2025': {
    fill: 'rgba(239, 68, 68, 0.85)',
    stroke: '#ffffff',
  },
};

function createDetectionStyle(year: OrthoYear): Style {
  const colors = DETECTION_STYLES[year];

  return new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({ color: colors.fill }),
      stroke: new Stroke({ color: colors.stroke, width: 1.5 }),
    }),
  });
}

function createDetectionLayer(config: DetectionLayerConfig): VectorLayer<VectorSource> {
  const layer = new VectorLayer({
    source: createDetectionSource(config.url),
    style: createDetectionStyle(config.year),
    visible: config.visible,
    minZoom: DETECTION_MIN_ZOOM,
    zIndex: 10,
  });

  detectionLayers.set(config.year, layer);
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
        ...DETECTION_LAYER_CONFIGS.map((layerConfig) => createDetectionLayer(layerConfig)),
      ],
      view: new View({
        center: fromLonLat(KRAKOW_CENTER),
        zoom: INITIAL_ZOOM,
        minZoom: INITIAL_ZOOM,
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
