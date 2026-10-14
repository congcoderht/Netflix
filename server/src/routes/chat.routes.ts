import { Router } from 'express'
import { respond } from '../controllers/chat.controller'
import { asyncHandler } from '../middlewares/async-handler'
import { authenticate } from '../middlewares/auth.middleware'
import { chatRateLimit } from '../middlewares/rate-limit.middleware'
import { validate } from '../middlewares/validate.middleware'
import { chatRequestSchema } from '../validation/chat.validation'

export const chatRouter = Router()

chatRouter.use(authenticate)
chatRouter.post('/', chatRateLimit, validate(chatRequestSchema), asyncHandler(respond))
