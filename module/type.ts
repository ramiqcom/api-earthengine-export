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
  name: string;
  metadata: {
    '@type': string;
    state: 'ENDING' | 'RUNNING' | 'CANCELLING' | 'SUCCEEDED' | 'CANCELLED' | 'FAILED';
    description: string;
    priority: number;
    createTime: string;
    updateTime: string;
    startTime: string;
    endTime?: string;
    type: 'EXPORT_IMAGE' | 'EXPORT_FEATURES' | 'EXPORT_MAP';
    attempt?: number;
    batchEecuUsageSeconds?: number;
    destinationUris?: string[];
    progress?: number;
    stages?: {
      completeWorkUnits: number;
      description: string;
      displayName: string;
      totalWorkUnits: number;
    }[];
    done?: boolean;
    error?: string;
    response: {
      '@type': string;
    };
  };
}

export interface ResponseView {
  url: string;
}

export interface ResponseExport {
  metadata: Record<string, any>;
}
