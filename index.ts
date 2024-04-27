import ee from '@google/earthengine';
import { config } from 'dotenv';
import fastify from 'fastify';
import compositeImage from './module/composite';
import sendDatabase from './module/database';
import { authenticate, cancelExport, exportMetadata } from './module/ee';
import exportImage from './module/export';
import { RequestExport, RequestView } from './module/type';
import view from './module/view';

// Google Cloud Run will set this environment variable for you, so
// you can also use it to detect if you are running in Cloud Run
const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined;

// You must listen on the port Cloud Run provides
const port = (process.env.PORT || 8080) as number;

// You must listen on all IPV4 addresses in Cloud Run
const host = IS_GOOGLE_CLOUD_RUN ? '0.0.0.0' : undefined;

// Run dotenv
config();

// Google private key
const key = process.env.SERVICE_ACCOUNT_KEY;

// App setting
const app = fastify({
  trustProxy: true,
});

// Hook for authentication
app.addHook('onRequest', async () => {
  await authenticate(key);
});

// Hook for error
app.addHook('onError', async (req, res, error) => {
  // Cancel operation when error
  const { name } = await exportMetadata();
  await cancelExport(name);

  res.send({ message: error }).status(404).header('Content-Type', 'application/json');
});

// App route for viewing image
app.post('/view', async (req, res) => {
  const { satellite, date, composite, geojson, visualization } = req.body as RequestView;

  // Set work tag
  ee.data.setWorkloadTag('app-view');

  const { image } = compositeImage({
    satellite,
    date,
    composite,
    geojson,
  });

  const result = await view(image, visualization, satellite);

  res.send(result).status(200).header('Content-Type', 'appplication/json');
});

// App route for exporting geotiff
app.post('/export/geotiff', async (req, res) => {
  const { satellite, date, composite, geojson, bucket, fileNamePrefix } = req.body as RequestExport;

  // Set work tag
  ee.data.setWorkloadTag('app-export-geotiff');

  const { image, resolution } = compositeImage({
    satellite,
    date,
    composite,
    geojson,
  });

  const time = new Date().getTime();
  const description = `${satellite}_${date[0]}_${date[1]}_${composite}_${time}`;

  const result = await exportImage({
    image,
    resolution,
    bucket,
    fileNamePrefix,
    region: geojson,
    description,
  });

  // Send database update
  await sendDatabase(req.body as RequestExport, result);

  res.send(result).status(200).header('Content-Type', 'appplication/json');
});

// Run the appss
try {
  const address = await app.listen({ port, host });
  console.log(`Listening on ${address}`);
} catch (err) {
  console.log(err);
  process.exit(1);
}

export default app;
