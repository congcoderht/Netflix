import { Router, Request, Response } from 'express';
import { z } from 'zod';
const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  // #swagger.tags = ['System']
  // #swagger.summary = 'Health Check'
  // #swagger.description = 'Returns the health status of the API'
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { healthRouter };
