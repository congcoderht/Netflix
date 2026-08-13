import { z } from 'zod'

const optionalUrl = z.union([z.url(), z.literal('')]).optional()

export const idParamsSchema = z.object({
  id: z.uuid(),
})

export const movieListQuerySchema = z.object({
  type: z.enum(['MOVIE', 'SERIES']).optional(),
  genreId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const movieCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  thumbnail: optionalUrl,
  trailerUrl: optionalUrl,
  type: z.enum(['MOVIE', 'SERIES']),
  videoUrl: optionalUrl,
  duration: z.coerce.number().int().positive().max(24 * 60).optional(),
  isPublished: z.boolean().optional(),
  genreIds: z.array(z.uuid()).max(30).optional(),
})

export const movieUpdateSchema = movieCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
)

export const actorSearchQuerySchema = z.object({
  q: z.string().trim().max(100).default(''),
})

export const actorCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  avatar: optionalUrl,
  bio: z.string().trim().max(5000).optional(),
})

export const movieActorsSchema = z.object({
  actors: z.array(z.object({
    actorId: z.uuid(),
    role: z.string().trim().min(1).max(150),
  })).max(100),
})
