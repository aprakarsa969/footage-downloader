// Setup aplikasi Express: JSON body, health check, Swagger docs, route, error handler global.
// Express 5 menangkap error async dari route → diteruskan ke errorHandler.
// Docs API (OpenAPI): spec statis di docs/openapi.json, disajikan via Swagger UI di /docs (tanpa auth).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const openapiSpec = JSON.parse(readFileSync('./docs/openapi.json', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(routes);

app.use(errorHandler);

export default app;
