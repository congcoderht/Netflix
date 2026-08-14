import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import * as controller from '../controllers/watch-progress.controller'
import {
  progressParamsSchema,
  progressQuerySchema,
  progressUpdateSchema,
  continueWatchingQuerySchema,
} from '../validation/watch-progress.validation'

export const watchProgressRouter = Router()

watchProgressRouter.get(
  '/',
  authenticate,
  validate(continueWatchingQuerySchema, 'query'),
  asyncHandler(controller.getContinueWatching),
)

watchProgressRouter.get(
  '/:movieId',
  authenticate,
  validate(progressParamsSchema, 'params'),
  validate(progressQuerySchema, 'query'),
  asyncHandler(controller.getProgress),
)

watchProgressRouter.put(
  '/:movieId',
  authenticate,
  validate(progressParamsSchema, 'params'),
  validate(progressUpdateSchema),
  asyncHandler(controller.saveProgress),
)
