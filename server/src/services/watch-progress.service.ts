import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

const resolveContent = async (movieId: string) => {
  const movie = await prisma.movie.findFirst({
    where: { id: movieId, isPublished: true },
    select: { id: true, duration: true },
  })
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')

  return { durationSec: movie.duration ? movie.duration * 60 : null }
}

const formatProgress = (progressSec: number, durationSec: number | null, updatedAt?: Date) => {
  const completed = durationSec !== null && durationSec > 0 && progressSec >= durationSec * 0.95
  return {
    progressSec,
    durationSec,
    completed,
    resumeFromSec: completed ? 0 : progressSec,
    updatedAt: updatedAt ?? null,
  }
}

export const getProgress = async (userId: string, movieId: string) => {
  const content = await resolveContent(movieId)
  const progress = await prisma.watchProgress.findUnique({
    where: { userId_movieId: { userId, movieId } },
    select: { progressSec: true, updatedAt: true },
  })
  return formatProgress(progress?.progressSec ?? 0, content.durationSec, progress?.updatedAt)
}

export const saveProgress = async (
  userId: string,
  movieId: string,
  requestedProgressSec: number,
) => {
  const content = await resolveContent(movieId)
  const progressSec = content.durationSec === null
    ? requestedProgressSec
    : Math.min(requestedProgressSec, content.durationSec)

  const saved = await prisma.$transaction(async (tx) => {
    const progress = await tx.watchProgress.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: { progressSec },
      create: { userId, movieId, progressSec },
      select: { progressSec: true, updatedAt: true },
    })

    const history = await tx.watchHistory.findFirst({
      where: { userId, movieId },
      select: { id: true },
    })
    if (history) {
      await tx.watchHistory.update({ where: { id: history.id }, data: { watchedAt: new Date() } })
    } else {
      await tx.watchHistory.create({ data: { userId, movieId } })
    }

    return progress
  })

  return formatProgress(saved.progressSec, content.durationSec, saved.updatedAt)
}

export const getContinueWatching = async (userId: string, limit: number) => {
  const rows = await prisma.watchProgress.findMany({
    where: {
      userId,
      progressSec: { gt: 0 },
      movie: { isPublished: true },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit * 3,
    select: {
      progressSec: true,
      updatedAt: true,
      movie: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          trailerUrl: true,
          videoUrl: true,
          duration: true,
          isPublished: true,
          createdAt: true,
          genres: { select: { genre: { select: { id: true, name: true } } } },
        },
      },
    },
  })

  const seenMovies = new Set<string>()
  return rows.flatMap((row) => {
    if (seenMovies.has(row.movie.id)) return []
    const durationSec = (row.movie.duration ?? 0) * 60
    if (durationSec > 0 && row.progressSec >= durationSec * 0.95) return []

    seenMovies.add(row.movie.id)
    const { videoUrl, ...publicMovie } = row.movie
    return [{
      movie: { ...publicMovie, hasVideo: Boolean(videoUrl) },
      progressSec: row.progressSec,
      durationSec: durationSec || null,
      progressPercent: durationSec > 0
        ? Math.min(100, Math.round((row.progressSec / durationSec) * 100))
        : 0,
      updatedAt: row.updatedAt,
    }]
  }).slice(0, limit)
}
