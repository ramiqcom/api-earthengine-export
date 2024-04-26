import ee from '@google/earthengine';
import { FeatureCollection } from '@turf/turf';
import { exportMetadata, startExport } from './ee';

export default async function exportImage({
  image,
  resolution,
  region,
  description,
  bucket,
  fileNamePrefix,
}: {
  image: ee.Image;
  resolution: number;
  region: FeatureCollection;
  description: string;
  bucket: string;
  fileNamePrefix: string;
}): Promise<Record<string, any>> {
  const task = ee.batch.Export.image.toCloudStorage({
    image,
    scale: resolution,
    region: region.features[0].geometry,
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
