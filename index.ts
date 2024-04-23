import { config } from 'dotenv';
import fastify from 'fastify';
import { authenticate } from './module/ee';

// Run dotenv
config();

// Google private key
const key = process.env.SERVICE_ACCOUNT_KEY;

// App setting
const app = fastify({
  logger: true,
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
  await app.listen({ port: 3000 });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
