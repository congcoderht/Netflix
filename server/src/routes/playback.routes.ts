import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import { playbackSessionParamsSchema, playbackStartSchema } from '../validation/playback.validation'
import * as controller from '../controllers/playback.controller'
import { playbackHeartbeatRateLimit, playbackStartRateLimit } from '../middlewares/rate-limit.middleware'

export const playbackRouter = Router()

playbackRouter.use(authenticate)
playbackRouter.get('/', asyncHandler(controller.list))
playbackRouter.post('/', playbackStartRateLimit, validate(playbackStartSchema), asyncHandler(controller.start))
playbackRouter.patch('/:id/heartbeat', playbackHeartbeatRateLimit, validate(playbackSessionParamsSchema, 'params'), asyncHandler(controller.heartbeat))
playbackRouter.delete('/:id', validate(playbackSessionParamsSchema, 'params'), asyncHandler(controller.end))
