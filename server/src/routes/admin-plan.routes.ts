import { Router } from 'express'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import { adminPlanCreateSchema, adminPlanParamsSchema, adminPlanUpdateSchema } from '../validation/admin-plan.validation'
import * as controller from '../controllers/admin-plan.controller'

export const adminPlanRouter = Router()

adminPlanRouter.use(authenticate, requireAdmin)
adminPlanRouter.get('/', asyncHandler(controller.list))
adminPlanRouter.post('/', validate(adminPlanCreateSchema), asyncHandler(controller.create))
adminPlanRouter.patch('/:id', validate(adminPlanParamsSchema, 'params'), validate(adminPlanUpdateSchema), asyncHandler(controller.update))
