import { z } from 'zod'

const optionalUrl = z.union([z.url(), z.literal('')]).optional()

export const movieParamsSchema = z.object({ movieId: z.uuid() })
export const seasonParamsSchema = z.object({
  movieId: z.uuid(),
  seasonId: z.uuid(),
})
export const episodeParamsSchema = z.object({
  movieId: z.uuid(),
  seasonId: z.uuid(),
  episodeId: z.uuid(),
})

export const seasonCreateSchema = z.object({
  number: z.coerce.number().int().positive().max(10_000),
  title: z.string().trim().min(1).max(200).optional(),
})

export const seasonUpdateSchema = seasonCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
)

export const episodeCreateSchema = z.object({
  number: z.coerce.number().int().positive().max(100_000),
  title: z.string().trim().min(1).max(200),
  videoUrl: optionalUrl,
  duration: z.coerce.number().int().positive().max(24 * 60).optional(),
  thumbnail: optionalUrl,
})

export const episodeUpdateSchema = episodeCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
)
