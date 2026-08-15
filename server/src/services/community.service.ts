import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

const USER_SELECT = { id: true, name: true, avatar: true }

const assertPublishedMovie = async (movieId: string) => {
  const movie = await prisma.movie.findFirst({ where: { id: movieId, isPublished: true }, select: { id: true } })
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')
}

export const getComments = async (movieId: string, page: number, limit: number) => {
  await assertPublishedMovie(movieId)
  const where = { movieId, parentId: null }
  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, content: true, isDeleted: true, createdAt: true, updatedAt: true,
        user: { select: USER_SELECT },
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, content: true, isDeleted: true, createdAt: true, updatedAt: true,
            user: { select: USER_SELECT },
          },
        },
      },
    }),
    prisma.comment.count({ where }),
  ])
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const createComment = async (userId: string, movieId: string, content: string, parentId?: string | null) => {
  await assertPublishedMovie(movieId)
  if (parentId) {
    const parent = await prisma.comment.findFirst({ where: { id: parentId, movieId, parentId: null }, select: { id: true } })
    if (!parent) throw new AppError(404, 'Parent comment not found', 'PARENT_COMMENT_NOT_FOUND')
  }
  return prisma.comment.create({
    data: { userId, movieId, content, parentId: parentId || null },
    select: { id: true, content: true, isDeleted: true, createdAt: true, updatedAt: true, user: { select: USER_SELECT } },
  })
}

export const updateComment = async (userId: string, movieId: string, commentId: string, content: string) => {
  const comment = await prisma.comment.findFirst({ where: { id: commentId, movieId }, select: { userId: true, isDeleted: true } })
  if (!comment) throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND')
  if (comment.userId !== userId) throw new AppError(403, 'You can only edit your own comments', 'COMMENT_FORBIDDEN')
  if (comment.isDeleted) throw new AppError(409, 'Deleted comments cannot be edited', 'COMMENT_DELETED')
  return prisma.comment.update({ where: { id: commentId }, data: { content }, select: { id: true, content: true, updatedAt: true } })
}

export const removeComment = async (userId: string, role: string, movieId: string, commentId: string) => {
  const comment = await prisma.comment.findFirst({ where: { id: commentId, movieId }, select: { userId: true } })
  if (!comment) throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND')
  if (comment.userId !== userId && role !== 'ADMIN') throw new AppError(403, 'You cannot delete this comment', 'COMMENT_FORBIDDEN')
  await prisma.comment.update({ where: { id: commentId }, data: { content: '', isDeleted: true } })
}

export const getRating = async (userId: string, movieId: string) => {
  await assertPublishedMovie(movieId)
  const [summary, own] = await Promise.all([
    prisma.rating.aggregate({ where: { movieId }, _avg: { score: true }, _count: { score: true } }),
    prisma.rating.findUnique({ where: { userId_movieId: { userId, movieId } }, select: { score: true } }),
  ])
  return { average: summary._avg.score ?? 0, count: summary._count.score, myRating: own?.score ?? null }
}

export const setRating = async (userId: string, movieId: string, score: number) => {
  await assertPublishedMovie(movieId)
  await prisma.rating.upsert({
    where: { userId_movieId: { userId, movieId } },
    create: { userId, movieId, score },
    update: { score },
  })
  return getRating(userId, movieId)
}
