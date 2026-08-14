import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const genreIdParamsSchema = z.object({ id: resourceIdSchema })

export const genreNameSchema = z.object({
  name: z.string().trim().min(1).max(100),
})
