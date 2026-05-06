import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import swaggerUi from 'swagger-ui-express';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import './config/passport';

import * as fs from 'fs';
import * as path from 'path';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

try {
  const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger_output.json'), 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
} catch (error) {
  console.log('Swagger docs not found. Run npm run swagger to generate.', error);
}

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
