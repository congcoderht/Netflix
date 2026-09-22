import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

const planFields = {
  code: z.string().trim().min(2).max(30).regex(/^[A-Z][A-Z0-9_]*$/),
  name: z.string().trim().min(2).max(100),
  price: z.coerce.number().int().min(0).max(1_000_000_000),
  currency: z.string().trim().length(3).regex(/^[A-Z]{3}$/),
  durationDays: z.coerce.number().int().min(1).max(3650),
  description: z.string().trim().max(500).nullable(),
  maxScreens: z.coerce.number().int().min(1).max(20),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  isActive: z.boolean(),
}

export const adminPlanParamsSchema = z.object({ id: resourceIdSchema })

export const adminPlanCreateSchema = z.object({
  ...planFields,
  currency: planFields.currency.default('VND'),
  durationDays: planFields.durationDays.default(30),
  description: planFields.description.optional().default(null),
  maxScreens: planFields.maxScreens.default(1),
  sortOrder: planFields.sortOrder.default(0),
  isActive: planFields.isActive.default(true),
})

export const adminPlanUpdateSchema = z.object({
  code: planFields.code.optional(),
  name: planFields.name.optional(),
  price: planFields.price.optional(),
  currency: planFields.currency.optional(),
  durationDays: planFields.durationDays.optional(),
  description: planFields.description.optional(),
  maxScreens: planFields.maxScreens.optional(),
  sortOrder: planFields.sortOrder.optional(),
  isActive: planFields.isActive.optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })
