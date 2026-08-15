import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import * as controller from '../controllers/watch-history.controller'
import { historyIdParamsSchema, historyListQuerySchema } from '../validation/watch-history.validation'

export const watchHistoryRouter = Router()

watchHistoryRouter.get('/', authenticate, validate(historyListQuerySchema, 'query'), asyncHandler(controller.getHistory))
watchHistoryRouter.delete('/', authenticate, asyncHandler(controller.clearHistory))
watchHistoryRouter.delete('/:id', authenticate, validate(historyIdParamsSchema, 'params'), asyncHandler(controller.removeHistoryItem))
