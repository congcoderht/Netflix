import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const paymentProviderSchema = z.enum(['MOCK_MOMO', 'MOCK_VNPAY'])

export const checkoutSchema = z.object({
  planId: resourceIdSchema,
  idempotencyKey: z.uuid(),
  provider: paymentProviderSchema,
})

export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const paymentParamsSchema = z.object({ id: resourceIdSchema })
export const paymentOrderParamsSchema = z.object({ orderId: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z_.-]*$/).max(100) })
export const mockPaymentParamsSchema = z.object({ provider: paymentProviderSchema })
export const mockPaymentCompletionSchema = z.object({
  paymentId: resourceIdSchema,
  checkoutToken: z.string().regex(/^[a-f0-9]+$/).min(64).max(128),
  outcome: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
})
