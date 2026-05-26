import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

export type OrthoYear = '2023' | '2025';

export const EPSG_2178 = 'EPSG:2178';
const EPSG_2178_PROJ =
  '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';

export const EPSG_2180 = 'EPSG:2180';
const EPSG_2180_PROJ =
  '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';

/** Map pan limits in EPSG:2180 — SW (242154.8, 564947.9) and NE (246499.2, 569227.4). */
export const MAP_PAN_EXTENT_2180: [number, number, number, number] = [
  564947.9, 242154.8, 569227.4, 246499.2, 
];

const detectionGeoJsonFormat = new GeoJSON({
  dataProjection: EPSG_2180,
  featureProjection: 'EPSG:3857',
});

let projectionsRegistered = false;

/** Registers the CRSs used by MSIP tiles and detection GeoJSON coordinates. */
export function registerDetectionProjections(): void {
  if (projectionsRegistered) {
    return;
  }

  proj4.defs(EPSG_2178, EPSG_2178_PROJ);
  proj4.defs(EPSG_2180, EPSG_2180_PROJ);
  register(proj4);
  projectionsRegistered = true;
}

/** Builds a vector source for vehicle detections exported in EPSG:2180. */
export function createDetectionSource(url: string): VectorSource {
  registerDetectionProjections();

  return new VectorSource({
    url,
    format: detectionGeoJsonFormat,
  });
}
