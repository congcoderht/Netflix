import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

export const getHistory = async (userId: string, page: number, limit: number) => {
  const where = { userId, movie: { isPublished: true } }
  const [items, total] = await Promise.all([
    prisma.watchHistory.findMany({
      where,
      orderBy: { watchedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        watchedAt: true,
        movie: {
          select: {
            id: true, title: true, description: true, thumbnail: true,
            trailerUrl: true, type: true, videoUrl: true, duration: true,
            isPublished: true, createdAt: true,
            genres: { select: { genre: { select: { id: true, name: true } } } },
          },
        },
        episode: {
          select: {
            id: true, number: true, title: true, thumbnail: true,
            season: { select: { number: true } },
          },
        },
      },
    }),
    prisma.watchHistory.count({ where }),
  ])
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const removeHistoryItem = async (userId: string, id: string) => {
  const result = await prisma.watchHistory.deleteMany({ where: { id, userId } })
  if (!result.count) throw new AppError(404, 'History item not found', 'HISTORY_NOT_FOUND')
}

export const clearHistory = async (userId: string) => {
  const result = await prisma.watchHistory.deleteMany({ where: { userId } })
  return { deleted: result.count }
}
