import { Role, SubscriptionStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { getDashboard } from './admin-dashboard.service'

export interface ChatToolContext {
  userId: string
  role: string
}

export interface MovieSuggestion {
  id: string
  title: string
  thumbnail: string | null
  duration: number | null
}

export interface ChatToolResult {
  data: unknown
  movies?: MovieSuggestion[]
}

const searchSchema = z.object({
  query: z.string().trim().max(120).optional(),
  genre: z.string().trim().max(80).optional(),
  actor: z.string().trim().max(120).optional(),
  maxDuration: z.coerce.number().int().min(1).max(600).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(6),
})

const movieDetailsSchema = z.object({
  movieId: z.string().trim().max(128).optional(),
  title: z.string().trim().max(200).optional(),
}).refine((value) => Boolean(value.movieId || value.title), 'movieId or title is required')

const dashboardSchema = z.object({
  period: z.enum(['month', 'year']).default('month'),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

const emptySchema = z.object({}).passthrough()

export const toolsForRole = (role: string) => {
  const common = [
    {
      type: 'function' as const,
      name: 'search_movies',
      description: 'Search the movie catalog and count every matching movie. The result contains totalCount plus a limited items list. Always use totalCount when answering how many movies exist; never infer a total from items.length.',
      parameters: {
        type: 'object', additionalProperties: false,
        properties: {
          query: { type: 'string' }, genre: { type: 'string' }, actor: { type: 'string' },
          maxDuration: { type: 'integer' }, limit: { type: 'integer', minimum: 1, maximum: 10 },
        },
      },
    },
    {
      type: 'function' as const,
      name: 'get_movie_details',
      description: 'Get detailed information about one movie by ID or title.',
      parameters: {
        type: 'object', additionalProperties: false,
        properties: { movieId: { type: 'string' }, title: { type: 'string' } },
      },
    },
    {
      type: 'function' as const,
      name: 'get_plans',
      description: 'Get active subscription plans and their prices, duration, and screen limits.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
    },
  ]

  const customer = [
    {
      type: 'function' as const,
      name: 'get_my_subscription',
      description: 'Get the authenticated customer current subscription. The user identity is supplied securely by the server.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
    },
    {
      type: 'function' as const,
      name: 'get_my_watch_activity',
      description: 'Get the authenticated customer recent watch history, unfinished movies, and watchlist.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
    },
    {
      type: 'function' as const,
      name: 'get_my_payments',
      description: 'Get the authenticated customer recent payment status and plan. Never returns secrets or payment URLs.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
    },
  ]

  const admin = [
    {
      type: 'function' as const,
      name: 'get_admin_dashboard',
      description: 'Get read-only admin metrics, revenue, popular movies, and payment counts for a month or year.',
      parameters: {
        type: 'object', additionalProperties: false,
        properties: {
          period: { type: 'string', enum: ['month', 'year'] }, year: { type: 'integer' }, month: { type: 'integer' },
        },
        required: ['year'],
      },
    },
    {
      type: 'function' as const,
      name: 'get_content_issues',
      description: 'Inspect the movie catalog read-only and list unpublished movies or movies missing thumbnail, trailer, video, genres, or actors.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
    },
    {
      type: 'function' as const,
      name: 'get_admin_statistics',
      description: 'Get read-only user, subscription, plan, and payment status counts.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
    },
  ]

  return [...common, ...(role === Role.ADMIN ? admin : customer)]
}

const movieSelection = {
  id: true, title: true, description: true, thumbnail: true, duration: true, isPublished: true,
  genres: { select: { genre: { select: { name: true } } } },
  actors: { select: { role: true, actor: { select: { name: true } } } },
  ratings: { select: { score: true } },
} as const

export const executeChatTool = async (
  name: string,
  rawArguments: Record<string, unknown>,
  context: ChatToolContext,
): Promise<ChatToolResult> => {
  if (name === 'search_movies') {
    const input = searchSchema.parse(rawArguments)
    const where = {
      ...(context.role === Role.ADMIN ? {} : { isPublished: true }),
      ...(input.query ? { OR: [
        { title: { contains: input.query, mode: 'insensitive' as const } },
        { description: { contains: input.query, mode: 'insensitive' as const } },
      ] } : {}),
      ...(input.genre ? { genres: { some: { genre: { name: { contains: input.genre, mode: 'insensitive' as const } } } } } : {}),
      ...(input.actor ? { actors: { some: { actor: { name: { contains: input.actor, mode: 'insensitive' as const } } } } } : {}),
      ...(input.maxDuration ? { duration: { lte: input.maxDuration } } : {}),
    }
    const [totalCount, movies] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        select: movieSelection,
      }),
    ])
    const items = movies.map((movie) => ({
      id: movie.id, title: movie.title, description: movie.description, duration: movie.duration,
      published: movie.isPublished,
      genres: movie.genres.map(({ genre }) => genre.name),
      actors: movie.actors.map(({ actor, role }) => ({ name: actor.name, role })),
      averageRating: movie.ratings.length
        ? movie.ratings.reduce((sum, rating) => sum + rating.score, 0) / movie.ratings.length
        : null,
    }))
    return {
      data: { totalCount, returnedCount: items.length, items },
      movies: movies.map(({ id, title, thumbnail, duration }) => ({ id, title, thumbnail, duration })),
    }
  }

  if (name === 'get_movie_details') {
    const input = movieDetailsSchema.parse(rawArguments)
    const movie = await prisma.movie.findFirst({
      where: {
        ...(context.role === Role.ADMIN ? {} : { isPublished: true }),
        ...(input.movieId ? { id: input.movieId } : { title: { equals: input.title!, mode: 'insensitive' } }),
      },
      select: movieSelection,
    })
    if (!movie) return { data: { found: false } }
    const data = {
      id: movie.id, title: movie.title, description: movie.description, duration: movie.duration,
      published: movie.isPublished, hasThumbnail: Boolean(movie.thumbnail),
      genres: movie.genres.map(({ genre }) => genre.name),
      actors: movie.actors.map(({ actor, role }) => ({ name: actor.name, role })),
      ratingCount: movie.ratings.length,
      averageRating: movie.ratings.length
        ? movie.ratings.reduce((sum, rating) => sum + rating.score, 0) / movie.ratings.length
        : null,
    }
    return { data, movies: [{ id: movie.id, title: movie.title, thumbnail: movie.thumbnail, duration: movie.duration }] }
  }

  if (name === 'get_plans') {
    emptySchema.parse(rawArguments)
    return { data: await prisma.plan.findMany({
      where: { isActive: true }, orderBy: { sortOrder: 'asc' },
      select: { code: true, name: true, price: true, currency: true, durationDays: true, description: true, maxScreens: true },
    }) }
  }

  if (name === 'get_my_subscription' && context.role !== Role.ADMIN) {
    emptySchema.parse(rawArguments)
    return { data: await prisma.subscription.findFirst({
      where: { userId: context.userId }, orderBy: { createdAt: 'desc' },
      select: { status: true, startedAt: true, expiresAt: true, plan: { select: { code: true, name: true, maxScreens: true, durationDays: true } } },
    }) }
  }

  if (name === 'get_my_watch_activity' && context.role !== Role.ADMIN) {
    emptySchema.parse(rawArguments)
    const [history, progress, watchlist] = await Promise.all([
      prisma.watchHistory.findMany({ where: { userId: context.userId }, orderBy: { watchedAt: 'desc' }, take: 8, select: { watchedAt: true, movie: { select: { id: true, title: true, duration: true, thumbnail: true } } } }),
      prisma.watchProgress.findMany({ where: { userId: context.userId, progressSec: { gt: 0 } }, orderBy: { updatedAt: 'desc' }, take: 8, select: { progressSec: true, updatedAt: true, movie: { select: { id: true, title: true, duration: true, thumbnail: true } } } }),
      prisma.watchList.findMany({ where: { userId: context.userId }, orderBy: { createdAt: 'desc' }, take: 8, select: { movie: { select: { id: true, title: true, duration: true, thumbnail: true } } } }),
    ])
    const movieMap = new Map([...history, ...progress].map((item) => [item.movie.id, item.movie]))
    watchlist.forEach(({ movie }) => movieMap.set(movie.id, movie))
    return { data: { history, progress, watchlist }, movies: [...movieMap.values()] }
  }

  if (name === 'get_my_payments' && context.role !== Role.ADMIN) {
    emptySchema.parse(rawArguments)
    return { data: await prisma.payment.findMany({
      where: { userId: context.userId }, orderBy: { createdAt: 'desc' }, take: 8,
      select: { orderId: true, planName: true, provider: true, amount: true, currency: true, status: true, paidAt: true, createdAt: true, failureMessage: true },
    }) }
  }

  if (name === 'get_admin_dashboard' && context.role === Role.ADMIN) {
    const input = dashboardSchema.parse(rawArguments)
    const dashboard = await getDashboard(input.period, input.year, input.month)
    return { data: dashboard, movies: dashboard.topMovies.map(({ id, title, thumbnail }) => ({ id, title, thumbnail, duration: null })) }
  }

  if (name === 'get_content_issues' && context.role === Role.ADMIN) {
    emptySchema.parse(rawArguments)
    const movies = await prisma.movie.findMany({
      where: { OR: [
        { isPublished: false }, { thumbnail: null }, { trailerUrl: null }, { videoUrl: null },
        { genres: { none: {} } }, { actors: { none: {} } },
      ] },
      take: 50, orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, thumbnail: true, trailerUrl: true, videoUrl: true, isPublished: true, duration: true, _count: { select: { genres: true, actors: true } } },
    })
    const data = movies.map((movie) => ({
      id: movie.id, title: movie.title,
      issues: [
        ...(!movie.isPublished ? ['unpublished'] : []), ...(!movie.thumbnail ? ['missing thumbnail'] : []),
        ...(!movie.trailerUrl ? ['missing trailer'] : []), ...(!movie.videoUrl ? ['missing video'] : []),
        ...(movie._count.genres === 0 ? ['missing genres'] : []), ...(movie._count.actors === 0 ? ['missing actors'] : []),
      ],
    }))
    return { data, movies: movies.map(({ id, title, thumbnail, duration }) => ({ id, title, thumbnail, duration })) }
  }

  if (name === 'get_admin_statistics' && context.role === Role.ADMIN) {
    emptySchema.parse(rawArguments)
    const now = new Date()
    const [users, blockedUsers, activeSubscriptions, expiredSubscriptions, plans, paymentGroups] = await Promise.all([
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.user.count({ where: { role: Role.USER, isBlocked: true } }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } } }),
      prisma.subscription.count({ where: { OR: [{ status: SubscriptionStatus.EXPIRED }, { expiresAt: { lte: now } }] } }),
      prisma.plan.findMany({ select: { name: true, _count: { select: { subscriptions: true } } }, orderBy: { sortOrder: 'asc' } }),
      prisma.payment.groupBy({ by: ['status'], _count: { status: true }, _sum: { amount: true } }),
    ])
    return { data: { users, blockedUsers, activeSubscriptions, expiredSubscriptions, plans, payments: paymentGroups } }
  }

  throw new Error(`Tool is unavailable for this role: ${name}`)
}
