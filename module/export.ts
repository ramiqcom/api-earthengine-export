import ee from '@google/earthengine';
import { Geometry } from '@turf/turf';
import { exportMetadata, startExport } from './ee';
import { RequestExportStatus } from './type';

export async function exportImage({
  image,
  resolution,
  region,
  description,
  bucket,
  fileNamePrefix,
}: {
  image: ee.Image;
  resolution: number;
  region: Geometry;
  description: string;
  bucket: string;
  fileNamePrefix: string;
}): Promise<RequestExportStatus> {
  const task = ee.batch.Export.image.toCloudStorage({
    image,
    scale: resolution,
    region,
    crs: 'EPSG:4326',
    formatOptions: { cloudOptimized: true },
    description,
    fileNamePrefix,
    bucket,
  });

  await startExport(task);

  const metadata = await exportMetadata();

  return metadata;
}

export async function exportTile({
  image,
  region,
  description,
  bucket,
  fileNamePrefix,
  maxZoom,
}: {
  image: ee.Image;
  region: Geometry;
  description: string;
  bucket: string;
  fileNamePrefix: string;
  maxZoom: number;
}): Promise<RequestExportStatus> {
  const task = ee.batch.Export.map.toCloudStorage({
    image,
    description,
    bucket,
    path: fileNamePrefix,
    minZoom: 0,
    maxZoom,
    region,
    writePublicTiles: true,
    skipEmptyTiles: true,
    bucketCorsUris: ['*'],
  });

  await startExport(task);

  const metadata = await exportMetadata();

  return metadata;
}
