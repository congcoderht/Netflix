import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const movieCommunityParamsSchema = z.object({ movieId: resourceIdSchema })
export const commentParamsSchema = z.object({ movieId: resourceIdSchema, commentId: resourceIdSchema })

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: resourceIdSchema.nullable().optional(),
})

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

export const ratingSchema = z.object({ score: z.coerce.number().int().min(1).max(5) })
