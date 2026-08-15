import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const historyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const historyIdParamsSchema = z.object({ id: resourceIdSchema })
