import { bbox, bboxPolygon, FeatureCollection, Geometry } from '@turf/turf';

export function boundingGeometry(geojson: FeatureCollection): Geometry {
  const bounds = bbox(geojson);
  const polygon = bboxPolygon(bounds);
  return polygon.geometry;
}
