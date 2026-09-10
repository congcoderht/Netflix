import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

const resolveContent = async (movieId: string, episodeId?: string | null) => {
  const movie = await prisma.movie.findFirst({
    where: { id: movieId, isPublished: true },
    select: { id: true, type: true, duration: true },
  })
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')

  if (movie.type === 'MOVIE') {
    if (episodeId) throw new AppError(400, 'Movies do not have episodes', 'INVALID_EPISODE')
    return { episodeId: null, durationSec: movie.duration ? movie.duration * 60 : null }
  }

  if (!episodeId) throw new AppError(400, 'Episode is required for a series', 'EPISODE_REQUIRED')
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, season: { movieId } },
    select: { id: true, duration: true },
  })
  if (!episode) throw new AppError(404, 'Episode not found for this movie', 'EPISODE_NOT_FOUND')
  return { episodeId: episode.id, durationSec: episode.duration ? episode.duration * 60 : null }
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

export const getProgress = async (userId: string, movieId: string, requestedEpisodeId?: string) => {
  const content = await resolveContent(movieId, requestedEpisodeId)
  const progress = await prisma.watchProgress.findFirst({
    where: { userId, movieId, episodeId: content.episodeId },
    select: { progressSec: true, updatedAt: true },
  })
  return formatProgress(progress?.progressSec ?? 0, content.durationSec, progress?.updatedAt)
}

export const saveProgress = async (
  userId: string,
  movieId: string,
  requestedEpisodeId: string | null | undefined,
  requestedProgressSec: number,
) => {
  const content = await resolveContent(movieId, requestedEpisodeId)
  const progressSec = content.durationSec === null
    ? requestedProgressSec
    : Math.min(requestedProgressSec, content.durationSec)

  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.watchProgress.findFirst({
      where: { userId, movieId, episodeId: content.episodeId },
      select: { id: true },
    })
    const progress = existing
      ? await tx.watchProgress.update({
        where: { id: existing.id },
        data: { progressSec },
        select: { progressSec: true, updatedAt: true },
      })
      : await tx.watchProgress.create({
      data: { userId, movieId, episodeId: content.episodeId, progressSec },
      select: { progressSec: true, updatedAt: true },
    })

    const history = await tx.watchHistory.findFirst({
      where: { userId, movieId, episodeId: content.episodeId },
      select: { id: true },
    })
    if (history) {
      await tx.watchHistory.update({ where: { id: history.id }, data: { watchedAt: new Date() } })
    } else {
      await tx.watchHistory.create({ data: { userId, movieId, episodeId: content.episodeId } })
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
          type: true,
          videoUrl: true,
          duration: true,
          isPublished: true,
          createdAt: true,
          genres: { select: { genre: { select: { id: true, name: true } } } },
        },
      },
      episode: {
        select: {
          id: true,
          number: true,
          title: true,
          duration: true,
          thumbnail: true,
          season: { select: { number: true } },
        },
      },
    },
  })

  const seenMovies = new Set<string>()
  return rows.flatMap((row) => {
    if (seenMovies.has(row.movie.id)) return []
    const durationSec = (row.episode?.duration ?? row.movie.duration ?? 0) * 60
    if (durationSec > 0 && row.progressSec >= durationSec * 0.95) return []

    seenMovies.add(row.movie.id)
    const { videoUrl, ...publicMovie } = row.movie
    return [{
      movie: { ...publicMovie, hasVideo: Boolean(videoUrl) },
      episode: row.episode ? {
        id: row.episode.id,
        number: row.episode.number,
        title: row.episode.title,
        thumbnail: row.episode.thumbnail,
        seasonNumber: row.episode.season.number,
      } : null,
      progressSec: row.progressSec,
      durationSec: durationSec || null,
      progressPercent: durationSec > 0
        ? Math.min(100, Math.round((row.progressSec / durationSec) * 100))
        : 0,
      updatedAt: row.updatedAt,
    }]
  }).slice(0, limit)
}
