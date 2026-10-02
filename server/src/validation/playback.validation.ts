import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const playbackStartSchema = z.object({
  movieId: resourceIdSchema,
  deviceId: z.string().trim().min(8).max(128),
})

export const playbackSessionParamsSchema = z.object({ id: resourceIdSchema })
