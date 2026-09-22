import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const adminUserListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
})

export const adminUserParamsSchema = z.object({ id: resourceIdSchema })
export const adminUserUpdateSchema = z.object({
  isBlocked: z.boolean(),
}).strict()
