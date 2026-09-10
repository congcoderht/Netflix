import { PaymentStatus, SubscriptionStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

const PLAYBACK_TIMEOUT_MS = 90_000
const MAINTENANCE_INTERVAL_MS = 60_000

export const cleanupExpiredState = async () => {
  const now = new Date()
  const playbackCutoff = new Date(now.getTime() - PLAYBACK_TIMEOUT_MS)
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
