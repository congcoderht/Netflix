import { NotificationType, Prisma, Role } from '@prisma/client'
import crypto from 'crypto'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'
import { emitNotification, emitNotificationRefresh } from '../lib/socket'

export type NotificationData = Record<string, string | number | boolean | null>

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  eventKey: string
  data?: NotificationData
  actionUrl?: string | null
  dedupeKey?: string | null
  expiresAt?: Date | null
}

const activeWhere = () => ({
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
})

export const createNotification = async (input: CreateNotificationInput) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        ...input,
        data: input.data as Prisma.InputJsonValue | undefined,
      },
    })
    emitNotification(input.userId, notification)
    return notification
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null
    throw error
  }
}

export const listNotifications = async (userId: string, limit: number, cursor?: string, unreadOnly = false) => {
  const items = await prisma.notification.findMany({
    where: {
      userId,
      ...activeWhere(),
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
  const hasMore = items.length > limit
  const pageItems = hasMore ? items.slice(0, limit) : items
  return {
    items: pageItems,
    nextCursor: hasMore ? pageItems.at(-1)?.id ?? null : null,
  }
}

export const unreadCount = (userId: string) => prisma.notification.count({
  where: { userId, readAt: null, ...activeWhere() },
})

export const markRead = async (userId: string, id: string) => {
  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  })
  const notification = await prisma.notification.findFirst({ where: { id, userId } })
  if (!notification) throw new AppError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND')
  if (result.count) emitNotificationRefresh(userId)
  return notification
}

export const markAllRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null, ...activeWhere() },
    data: { readAt: new Date() },
  })
  emitNotificationRefresh(userId)
  return { updated: result.count }
}

export const removeNotification = async (userId: string, id: string) => {
  const result = await prisma.notification.deleteMany({ where: { id, userId } })
  if (!result.count) throw new AppError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND')
  emitNotificationRefresh(userId)
}

export const notifyMoviePublished = async (movie: { id: string; title: string }) => {
  const users = await prisma.user.findMany({
    where: { role: Role.USER, isBlocked: false },
    select: { id: true },
  })
  await Promise.all(users.map(({ id: userId }) => createNotification({
    userId,
    type: NotificationType.NEW_MOVIE,
    eventKey: 'moviePublished',
    data: { movieTitle: movie.title },
    actionUrl: `/movies/${movie.id}`,
    dedupeKey: `movie:${movie.id}:published:${userId}`,
  })))
}

export const notifyCommentReply = async (input: {
  recipientId: string
  actorName: string
  movieId: string
  movieTitle: string
  commentId: string
  replyId: string
}) => createNotification({
  userId: input.recipientId,
  type: NotificationType.COMMENT,
  eventKey: 'commentReply',
  data: { actorName: input.actorName, movieTitle: input.movieTitle, movieId: input.movieId },
  actionUrl: `/movies/${input.movieId}#comment-${input.commentId}`,
  dedupeKey: `comment:${input.commentId}:reply:${input.replyId}`,
})

interface PaymentNotificationInput {
  userId: string
  paymentId: string
  eventKey: 'paymentFailed' | 'paymentExpired' | 'subscriptionActivated' | 'subscriptionRenewed' | 'subscriptionChanged'
  planName: string
  orderId: string
}

export const paymentNotificationData = (input: PaymentNotificationInput) => ({
  userId: input.userId,
  type: input.eventKey.startsWith('payment') ? NotificationType.PAYMENT : NotificationType.SUBSCRIPTION,
  eventKey: input.eventKey,
  data: { planName: input.planName, orderId: input.orderId },
  actionUrl: '/billing',
  dedupeKey: `payment:${input.paymentId}:${input.eventKey}`,
})

export const deliverStoredNotification = (notification: { userId: string }) => {
  emitNotification(notification.userId, notification)
}

export const notifyPayment = async (input: PaymentNotificationInput) => createNotification(paymentNotificationData(input))

export const notifySubscriptionMilestone = async (input: {
  userId: string
  subscriptionId: string
  planName: string
  eventKey: 'subscriptionExpiring' | 'subscriptionExpired'
  days?: number
}) => createNotification({
  userId: input.userId,
  type: NotificationType.SUBSCRIPTION,
  eventKey: input.eventKey,
  data: { planName: input.planName, ...(input.days ? { days: input.days } : {}) },
  actionUrl: '/billing',
  dedupeKey: `subscription:${input.subscriptionId}:${input.eventKey}:${input.days ?? 'final'}`,
})

export const broadcastSystemNotification = async (input: {
  titleVi: string
  titleEn: string
  bodyVi: string
  bodyEn: string
  actionUrl?: string | null
  expiresAt?: Date | null
}) => {
  const users = await prisma.user.findMany({
    where: { role: Role.USER, isBlocked: false },
    select: { id: true },
  })
  const broadcastId = crypto.randomUUID()
  await Promise.all(users.map(({ id: userId }) => createNotification({
    userId,
    type: NotificationType.SYSTEM,
    eventKey: 'systemAnnouncement',
    data: {
      titleVi: input.titleVi,
      titleEn: input.titleEn,
      bodyVi: input.bodyVi,
      bodyEn: input.bodyEn,
    },
    actionUrl: input.actionUrl,
    expiresAt: input.expiresAt,
    dedupeKey: `system:${broadcastId}:${userId}`,
  })))
  return { recipients: users.length }
}
