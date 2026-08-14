import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const progressParamsSchema = z.object({ movieId: resourceIdSchema })

export const progressQuerySchema = z.object({
  episodeId: resourceIdSchema.optional(),
})

export const progressUpdateSchema = z.object({
  episodeId: resourceIdSchema.nullable().optional(),
  progressSec: z.coerce.number().int().min(0).max(7 * 24 * 60 * 60),
})

export const continueWatchingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
