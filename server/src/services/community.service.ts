import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'
import { notifyCommentReply } from './notification.service'

const USER_SELECT = { id: true, name: true, avatar: true }
const REPLY_TO_SELECT = { id: true, user: { select: USER_SELECT } }

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
            replyTo: { select: REPLY_TO_SELECT },
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
  let replyTarget: { id: string; parentId: string | null; userId: string; movie: { title: string } } | null = null
  if (parentId) {
    replyTarget = await prisma.comment.findFirst({
      where: { id: parentId, movieId, isDeleted: false },
      select: { id: true, parentId: true, userId: true, movie: { select: { title: true } } },
    })
    if (!replyTarget) throw new AppError(404, 'Reply target not found', 'REPLY_TARGET_NOT_FOUND')
  }
  const comment = await prisma.comment.create({
    data: {
      userId,
      movieId,
      parentId: replyTarget ? (replyTarget.parentId || replyTarget.id) : null,
      replyToId: replyTarget?.id || null,
      content,
    },
    select: {
      id: true, content: true, isDeleted: true, createdAt: true, updatedAt: true,
      user: { select: USER_SELECT },
      replyTo: { select: REPLY_TO_SELECT },
    },
  })
  if (replyTarget && replyTarget.userId !== userId) {
    await notifyCommentReply({
      recipientId: replyTarget.userId,
      actorName: comment.user.name || 'Netflix',
      movieId,
      movieTitle: replyTarget.movie.title,
      commentId: comment.id,
      replyId: comment.id,
    }).catch((error) => console.error('Comment notification failed:', error))
  }
  return comment
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
