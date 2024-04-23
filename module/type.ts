import { FeatureCollection } from '@turf/turf';

export interface VisObject {
  bands?: string[] | string;
  min: number[] | number;
  max: number[] | number;
  palette?: string[] | string;
}

export interface MapId {
  mapid: string;
  urlFormat: string;
  image: Record<string, any>;
}

interface RequestBody {
  geojson: FeatureCollection;
  date: [string, string];
  composite: 'latest' | 'cloudless' | 'median';
  satellite: 'planet' | 'landsat' | 'sentinel-2';
}

export interface RequestView extends RequestBody {
  visualization: 'true_color' | 'standard_false_color' | 'ndvi' | 'ndwi';
}

export interface RequestExport extends RequestBody {
  bucket: string;
  fileNamePrefix: string;
}

export interface RequestExportStatus {
  operationName: string[];
}

export interface ResponseView {
  url: string;
}

export interface ResponseExport {
  metadata: Record<string, any>;
}
