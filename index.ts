import ee from '@google/earthengine';
import { config } from 'dotenv';
import fastify from 'fastify';
import { boundingGeometry } from './module/bounds';
import compositeImage from './module/composite';
import { sendDatabase, updateDatabase } from './module/database';
import { authenticate, cancelExport, exportMetadata } from './module/ee';
import { exportImage, exportTile } from './module/export';
import { RequestExport, RequestExportTile, RequestView } from './module/type';
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

// App setting
const app = fastify({
  trustProxy: true,
});

// Hook for authentication
app.addHook('onRequest', async () => {
  // Authenticate Google Earth Engine with api key
  // Google private key
  const key = process.env.SERVICE_ACCOUNT_KEY;
  await authenticate(key);
});

// Error handler
app.setErrorHandler(async (error, req, res) => {
  const { message } = error;
  console.error(message);
  res.status(404).send({ message: error.message }).header('Content-Type', 'application/json');
});

// App route for viewing image
app.post('/view', async (req, res) => {
  const { satellite, date, composite, geojson, visualization } = req.body as RequestView;

  // Set work tag
  ee.data.setWorkloadTag('app-view');

  // Geometry
  const geometry = boundingGeometry(geojson);

  const { image } = compositeImage({
    satellite,
    date,
    composite,
    geometry,
  });

  const result = await view(image, visualization, satellite);

  res.status(200).send(result).header('Content-Type', 'appplication/json');
});

// App route for exporting geotiff
app.post('/export/geotiff', async (req, res) => {
  try {
    const { satellite, date, composite, geojson, bucket, fileNamePrefix } =
      req.body as RequestExport;

    // Set work tag
    ee.data.setWorkloadTag('app-export-geotiff');

    // Geometry
    const geometry = boundingGeometry(geojson);

    const { image, resolution } = compositeImage({
      satellite,
      date,
      composite,
      geometry,
    });

    const time = new Date().getTime();
    const description = `${satellite}_${date[0]}_${date[1]}_${composite}_${time}`;

    const result = await exportImage({
      image,
      resolution,
      bucket,
      fileNamePrefix,
      region: geometry,
      description,
    });

    // Send database update
    await sendDatabase(req.body as RequestExport, result);

    res.status(200).send(result).header('Content-Type', 'appplication/json');
  } catch ({ message }) {
    // Cancel operation when error
    const { name } = await exportMetadata();
    await cancelExport(name);

    // Make the error public
    throw new Error(message);
  }
});

// App route for exporting geotiff
app.post('/export/tile', async (req, res) => {
  try {
    const { satellite, visualization, date, composite, geojson, bucket, fileNamePrefix, maxZoom } =
      req.body as RequestExportTile;

    // Set work tag
    ee.data.setWorkloadTag('app-export-geotiff');

    // Geometry
    const geometry = boundingGeometry(geojson);

    const { image } = compositeImage({
      satellite,
      date,
      composite,
      geometry,
    });

    const time = new Date().getTime();
    const description = `${satellite}_${date[0]}_${date[1]}_${composite}_${time}`;

    // Visualize the image
    const { vis } = await view(image, visualization, satellite);

    const result = await exportTile({
      image: image.visualize(vis),
      bucket,
      fileNamePrefix,
      region: geometry,
      description,
      maxZoom,
    });

    // Send database update
    await sendDatabase(req.body as RequestExport, result);

    res.status(200).send(result).header('Content-Type', 'appplication/json');
  } catch ({ message }) {
    // Cancel operation when error
    const { name } = await exportMetadata();
    await cancelExport(name);

    // Make the error public
    throw new Error(message);
  }
});

// App route to update every task to the database
app.get('/update', async (req, res) => {
  const message = await updateDatabase();
  res.status(200).send({ message }).header('Content-Type', 'application/json');
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
