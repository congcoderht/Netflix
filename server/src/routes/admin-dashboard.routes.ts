import { Router } from 'express'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { dashboard } from '../controllers/admin-dashboard.controller'
import { validate } from '../middlewares/validate.middleware'
import { adminDashboardQuerySchema } from '../validation/admin-dashboard.validation'

export const adminDashboardRouter = Router()
adminDashboardRouter.get('/', authenticate, requireAdmin, validate(adminDashboardQuerySchema, 'query'), asyncHandler(dashboard))
