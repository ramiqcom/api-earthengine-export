import { config } from 'dotenv';
import fastify from 'fastify';
import { authenticate } from './module/ee';

// Define port
const port = (process.env.PORT || 8080) as number;

// Run dotenv
config();

// Google private key
const key = process.env.SERVICE_ACCOUNT_KEY;

// App setting
const app = fastify({
  logger: true,
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
  await app.listen({ port });
} catch (err) {
  console.log(err);
  process.exit(1);
}
