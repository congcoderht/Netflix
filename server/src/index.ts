import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import swaggerUi from 'swagger-ui-express';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middlewares/error.middleware';

import * as fs from 'fs';
import * as path from 'path';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Auto-Generated API Docs
try {
  const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger_output.json'), 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
} catch (error) {
  console.log('Swagger docs not found. Run npm run swagger to generate.', error);
}

// Dev server restart triggered

// Routes
app.use('/api/health', healthRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📦 Environment: ${config.nodeEnv}`);
});

export default app;
