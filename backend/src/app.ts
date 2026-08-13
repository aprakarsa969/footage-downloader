// Setup aplikasi Express: CORS, JSON body, health check, Swagger docs, route, error handler global.
// Express 5 menangkap error async dari route → diteruskan ke errorHandler.
// CORS: allowlist dari env CORS_ORIGINS (lihat config/cors.ts) — perlu untuk frontend di port beda.
// Docs API (OpenAPI): spec statis di docs/openapi.json, disajikan via Swagger UI di /docs (tanpa auth).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import CORS_ORIGINS from './config/cors.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const openapiSpec = JSON.parse(readFileSync('./docs/openapi.json', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(routes);

app.use(errorHandler);

export default app;
