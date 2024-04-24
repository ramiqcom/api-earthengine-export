import { config } from 'dotenv';
import fastify from 'fastify';
import { authenticate } from './module/ee';

// Google Cloud Run will set this environment variable for you, so
// you can also use it to detect if you are running in Cloud Run
const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined;

// You must listen on the port Cloud Run provides
const port = (process.env.PORT || 3000) as number;

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

// App route
app.get('/', async (req, res) => {
  try {
    await authenticate(key);
    res.send('Succes');
  } catch ({ message }) {
    res.send(message);
  }
});

// Run the app
try {
  const address = await app.listen({ port, host });
  console.log(`Listening on ${address}`);
} catch (err) {
  console.log(err);
  process.exit(1);
}

export default app;
