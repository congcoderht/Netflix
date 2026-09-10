import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import {
  checkoutSchema,
  mockPaymentCompletionSchema,
  mockPaymentParamsSchema,
  paymentListQuerySchema,
  paymentOrderParamsSchema,
  paymentParamsSchema,
} from '../validation/billing.validation'
import * as controller from '../controllers/billing.controller'
import { checkoutRateLimit } from '../middlewares/rate-limit.middleware'

export const billingRouter = Router()

billingRouter.get('/plans', asyncHandler(controller.listPlans))
billingRouter.get('/subscriptions/me', authenticate, asyncHandler(controller.currentSubscription))
billingRouter.post('/payments/checkout', authenticate, checkoutRateLimit, validate(checkoutSchema), asyncHandler(controller.checkout))
billingRouter.post(
  '/payments/mock/:provider/complete',
  authenticate,
  checkoutRateLimit,
  validate(mockPaymentParamsSchema, 'params'),
  validate(mockPaymentCompletionSchema),
  asyncHandler(controller.completeMockPayment),
)
billingRouter.get('/payments', authenticate, validate(paymentListQuerySchema, 'query'), asyncHandler(controller.listPayments))
billingRouter.get('/payments/order/:orderId', authenticate, validate(paymentOrderParamsSchema, 'params'), asyncHandler(controller.getPaymentByOrder))
billingRouter.get('/payments/:id', authenticate, validate(paymentParamsSchema, 'params'), asyncHandler(controller.getPayment))
