import { PaymentStatus, SubscriptionStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { notifyPayment, notifySubscriptionMilestone } from './notification.service'

const PLAYBACK_TIMEOUT_MS = 90_000
const MAINTENANCE_INTERVAL_MS = 60_000

export const cleanupExpiredState = async () => {
  const now = new Date()
  const playbackCutoff = new Date(now.getTime() - PLAYBACK_TIMEOUT_MS)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000)
  const [pendingPayments, expiredSubscriptions, expiringSubscriptions] = await Promise.all([
    prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING, expiresAt: { lte: now } },
      select: { id: true, userId: true, planName: true, orderId: true },
    }),
    prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE, expiresAt: { lte: now } },
      include: { plan: { select: { name: true } } },
    }),
    prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now, lte: sevenDaysFromNow } },
      include: { plan: { select: { name: true } } },
    }),
  ])
  const [payments, subscriptions, playbackSessions] = await prisma.$transaction([
    prisma.payment.updateMany({
      where: { status: PaymentStatus.PENDING, expiresAt: { lte: now } },
      data: { status: PaymentStatus.EXPIRED, failureCode: 'PAYMENT_EXPIRED', failureMessage: 'Payment session expired' },
    }),
    prisma.subscription.updateMany({
      where: { status: SubscriptionStatus.ACTIVE, expiresAt: { lte: now } },
      data: { status: SubscriptionStatus.EXPIRED },
    }),
    prisma.playbackSession.updateMany({
      where: { endedAt: null, lastHeartbeat: { lt: playbackCutoff } },
      data: { endedAt: now },
    }),
  ])

  const milestones = new Set([7, 3, 1])
  await Promise.all([
    ...pendingPayments.map((payment) => notifyPayment({
      userId: payment.userId,
      paymentId: payment.id,
      eventKey: 'paymentExpired',
      planName: payment.planName,
      orderId: payment.orderId,
    })),
    ...expiredSubscriptions.map((subscription) => notifySubscriptionMilestone({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      planName: subscription.plan.name,
      eventKey: 'subscriptionExpired',
    })),
    ...expiringSubscriptions.flatMap((subscription) => {
      const days = Math.ceil((subscription.expiresAt.getTime() - now.getTime()) / 86_400_000)
      if (!milestones.has(days)) return []
      return [notifySubscriptionMilestone({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        planName: subscription.plan.name,
        eventKey: 'subscriptionExpiring',
        days,
      })]
    }),
  ]).catch((error) => console.error('Maintenance notification failed:', error))

  return {
    expiredPayments: payments.count,
    expiredSubscriptions: subscriptions.count,
    closedPlaybackSessions: playbackSessions.count,
  }
}

export const startMaintenance = () => {
  void cleanupExpiredState().catch((error) => console.error('Maintenance cleanup failed:', error))
  const timer = setInterval(() => {
    void cleanupExpiredState().catch((error) => console.error('Maintenance cleanup failed:', error))
  }, MAINTENANCE_INTERVAL_MS)
  timer.unref()
  return () => clearInterval(timer)
}
