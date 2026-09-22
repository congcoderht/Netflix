import { Router } from 'express'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import { adminUserListSchema, adminUserParamsSchema, adminUserUpdateSchema } from '../validation/admin-user.validation'
import * as controller from '../controllers/admin-user.controller'

export const adminUserRouter = Router()
adminUserRouter.use(authenticate, requireAdmin)
adminUserRouter.get('/', validate(adminUserListSchema, 'query'), asyncHandler(controller.list))
adminUserRouter.patch('/:id', validate(adminUserParamsSchema, 'params'), validate(adminUserUpdateSchema), asyncHandler(controller.update))
