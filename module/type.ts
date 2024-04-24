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

export type satellite = 'planet' | 'landsat' | 'sentinel-2';

export interface RequestBody {
  geojson: FeatureCollection;
  date: [string, string];
  composite: 'latest' | 'cloudless' | 'median';
  satellite: satellite;
}

export interface RequestView extends RequestBody {
  visualization: string;
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
