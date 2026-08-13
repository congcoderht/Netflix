import { z } from 'zod'

export const genreIdParamsSchema = z.object({ id: z.uuid() })

export const genreNameSchema = z.object({
  name: z.string().trim().min(1).max(100),
})
