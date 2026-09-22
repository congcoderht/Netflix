import { SubscriptionStatus } from '@prisma/client'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'

export const listUsers = async (page: number, limit: number, search?: string) => {
  const now = new Date()
  const where = search ? { OR: [
    { email: { contains: search, mode: 'insensitive' as const } },
    { name: { contains: search, mode: 'insensitive' as const } },
  ] } : {}
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, avatar: true, role: true, isBlocked: true, createdAt: true,
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } },
          orderBy: { expiresAt: 'desc' }, take: 1,
          select: { expiresAt: true, plan: { select: { id: true, name: true, code: true } } },
        },
        _count: { select: { payments: true } },
      },
    }),
    prisma.user.count({ where }),
  ])
  return {
    items: items.map(({ subscriptions, ...user }) => ({ ...user, subscription: subscriptions[0] ?? null })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  }
}

export const updateUser = async (actorId: string, id: string, data: { isBlocked: boolean }) => {
  if (actorId === id && data.isBlocked) {
    throw new AppError(409, 'You cannot block your own account', 'SELF_ADMIN_CHANGE')
  }
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
  return prisma.user.update({ where: { id }, data, select: { id: true, isBlocked: true } })
}
