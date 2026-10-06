import { Router } from 'express'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import * as controller from '../controllers/notification.controller'
import {
  notificationListQuerySchema,
  notificationParamsSchema,
  systemNotificationSchema,
} from '../validation/notification.validation'

export const notificationRouter = Router()
notificationRouter.use(authenticate)
notificationRouter.get('/', validate(notificationListQuerySchema, 'query'), asyncHandler(controller.list))
notificationRouter.get('/unread-count', asyncHandler(controller.countUnread))
notificationRouter.patch('/read-all', asyncHandler(controller.markAllRead))
notificationRouter.patch('/:id/read', validate(notificationParamsSchema, 'params'), asyncHandler(controller.markRead))
notificationRouter.delete('/:id', validate(notificationParamsSchema, 'params'), asyncHandler(controller.remove))

export const adminNotificationRouter = Router()
adminNotificationRouter.use(authenticate, requireAdmin)
adminNotificationRouter.post('/broadcast', validate(systemNotificationSchema), asyncHandler(controller.broadcast))
