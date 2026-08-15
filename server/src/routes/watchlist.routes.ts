import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import { progressParamsSchema } from '../validation/watch-progress.validation'
import * as controller from '../controllers/watchlist.controller'

export const watchlistRouter = Router()

watchlistRouter.get('/', authenticate, asyncHandler(controller.getWatchlist))
watchlistRouter.get('/:movieId/status', authenticate, validate(progressParamsSchema, 'params'), asyncHandler(controller.getStatus))
watchlistRouter.post('/:movieId', authenticate, validate(progressParamsSchema, 'params'), asyncHandler(controller.addToWatchlist))
watchlistRouter.delete('/:movieId', authenticate, validate(progressParamsSchema, 'params'), asyncHandler(controller.removeFromWatchlist))
