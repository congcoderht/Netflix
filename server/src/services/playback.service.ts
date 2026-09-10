import { Prisma, SubscriptionStatus } from '@prisma/client'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'

const SESSION_TIMEOUT_MS = 90_000

export const startPlayback = async (userId: string, role: string, movieId: string, episodeId: string | undefined, deviceId: string) => {
  const movie = await prisma.movie.findFirst({
    where: { id: movieId, ...(role === 'ADMIN' ? {} : { isPublished: true }) },
    select: { videoUrl: true },
  })
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')
  const episode = episodeId ? await prisma.episode.findFirst({
    where: { id: episodeId, season: { movieId } },
    select: { videoUrl: true },
  }) : undefined
  if (episodeId && !episode) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND')
  const videoUrl = episodeId ? episode?.videoUrl : movie.videoUrl
  if (!videoUrl) throw new AppError(409, 'Video is not available', 'VIDEO_NOT_AVAILABLE')

  const now = new Date()
  const cutoff = new Date(now.getTime() - SESSION_TIMEOUT_MS)
  let maxScreens = Number.MAX_SAFE_INTEGER
  if (role !== 'ADMIN') {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' },
      include: { plan: { select: { maxScreens: true } } },
    })
    if (!subscription) throw new AppError(403, 'An active subscription is required', 'SUBSCRIPTION_REQUIRED')
    maxScreens = subscription.plan.maxScreens
  }

  return prisma.$transaction(async (tx) => {
    await tx.playbackSession.updateMany({
      where: { userId, endedAt: null, OR: [{ lastHeartbeat: { lt: cutoff } }, { deviceId }] },
      data: { endedAt: now },
    })
    const activeCount = await tx.playbackSession.count({ where: { userId, endedAt: null, lastHeartbeat: { gte: cutoff } } })
    if (activeCount >= maxScreens) throw new AppError(409, 'Concurrent screen limit reached', 'SCREEN_LIMIT_REACHED')
    const session = await tx.playbackSession.create({ data: { userId, deviceId, movieId, episodeId } })
    return { sessionId: session.id, videoUrl, heartbeatIntervalSec: 30, expiresAfterSec: 90 }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export const heartbeat = async (userId: string, id: string) => {
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS)
  const updated = await prisma.playbackSession.updateMany({
    where: { id, userId, endedAt: null, lastHeartbeat: { gte: cutoff } },
    data: { lastHeartbeat: new Date() },
  })
  if (!updated.count) throw new AppError(404, 'Playback session expired', 'PLAYBACK_SESSION_EXPIRED')
}

export const endPlayback = async (userId: string, id: string) => {
  await prisma.playbackSession.updateMany({ where: { id, userId, endedAt: null }, data: { endedAt: new Date() } })
}
