import ee from '@google/earthengine';
import { config } from 'dotenv';
import fastify from 'fastify';
import compositeImage from './module/composite';
import { authenticate } from './module/ee';
import { RequestView } from './module/type';
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

// App route for viewing image
app.post('/view', async (req, res) => {
  const { satellite, date, composite, geojson, visualization } = req.body as RequestView;

  try {
    await authenticate(key);

    ee.data.setWorkloadTag('app-view');

    const image = compositeImage({
      satellite,
      date,
      composite,
      geojson,
    });

    const result = await view(image, visualization, satellite);

    res.send(result).status(200).header('Content-Type', 'appplication/json');
  } catch ({ message }) {
    res.send({ message }).status(400).header('Content-Type', 'application/json');
  }
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
