import { prisma } from '../lib/prisma'
import { ContentType } from '@prisma/client'

interface MovieFilters {
  type?: ContentType
  genreId?: string
  search?: string
  page?: number
  limit?: number
  published?: boolean
}

interface MovieCreateInput {
  title: string
  description?: string
  thumbnail?: string
  trailerUrl?: string
  type: ContentType
  videoUrl?: string
  duration?: number
  isPublished?: boolean
  genreIds?: string[]
}

const MOVIE_SELECT = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  trailerUrl: true,
  type: true,
  videoUrl: true,
  duration: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  genres: { select: { genre: { select: { id: true, name: true } } } },
  actors: { select: { role: true, actor: { select: { id: true, name: true, avatar: true } } } },
}

export const getList = async (filters: MovieFilters) => {
  const { type, genreId, search, page = 1, limit = 20, published } = filters
  const skip = (page - 1) * limit

  const where: any = {}
  if (type) where.type = type
  if (published !== undefined) where.isPublished = published
  if (search) where.title = { contains: search, mode: 'insensitive' }
  if (genreId) where.genres = { some: { genreId } }

  const [items, total] = await Promise.all([
    prisma.movie.findMany({ where, select: MOVIE_SELECT, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.movie.count({ where }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const getById = (id: string, includeUnpublished = false) =>
  prisma.movie.findUnique({
    where: { id, ...(includeUnpublished ? {} : { isPublished: true }) },
    select: {
      ...MOVIE_SELECT,
      seasons: {
        orderBy: { number: 'asc' },
        select: {
          id: true, number: true, title: true,
          episodes: {
            orderBy: { number: 'asc' },
            select: { id: true, number: true, title: true, duration: true, thumbnail: true },
          },
        },
      },
    },
  })

export const create = async (data: MovieCreateInput) => {
  const { genreIds, ...rest } = data
  return prisma.movie.create({
    data: {
      ...rest,
      genres: genreIds?.length
        ? { create: genreIds.map((genreId) => ({ genre: { connect: { id: genreId } } })) }
        : undefined,
    },
    select: MOVIE_SELECT,
  })
}

export const update = async (id: string, data: Partial<MovieCreateInput>) => {
  const { genreIds, ...rest } = data
  return prisma.movie.update({
    where: { id },
    data: {
      ...rest,
      ...(genreIds !== undefined && {
        genres: {
          deleteMany: {},
          create: genreIds.map((genreId) => ({ genre: { connect: { id: genreId } } })),
        },
      }),
    },
    select: MOVIE_SELECT,
  })
}

export const remove = async (id: string) => {
  await prisma.movie.delete({ where: { id } })
}

// ── Actor management ─────────────────────────────────────────────────────────

export const searchActors = (q: string) =>
  prisma.actor.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    select: { id: true, name: true, avatar: true },
    take: 10,
  })

export const upsertActor = (data: { name: string; avatar?: string; bio?: string }) =>
  prisma.actor.create({ data })

export const setMovieActors = async (movieId: string, actors: { actorId: string; role: string }[]) => {
  await prisma.actorOnMovie.deleteMany({ where: { movieId } })
  if (actors.length) {
    await prisma.actorOnMovie.createMany({
      data: actors.map((a) => ({ movieId, actorId: a.actorId, role: a.role })),
    })
  }
}
