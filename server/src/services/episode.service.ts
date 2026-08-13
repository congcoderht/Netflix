import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

const assertMovieExists = async (movieId: string) => {
  const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true, type: true } })
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')
  if (movie.type !== 'SERIES') throw new AppError(409, 'Seasons can only be added to series', 'MOVIE_NOT_SERIES')
}

const assertSeasonOwnership = async (movieId: string, seasonId: string) => {
  const season = await prisma.season.findFirst({
    where: { id: seasonId, movieId },
    select: { id: true },
  })
  if (!season) throw new AppError(404, 'Season not found for this movie', 'SEASON_NOT_FOUND')
}

const assertEpisodeOwnership = async (seasonId: string, episodeId: string) => {
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, seasonId },
    select: { id: true },
  })
  if (!episode) throw new AppError(404, 'Episode not found for this season', 'EPISODE_NOT_FOUND')
}

// ── Season ──────────────────────────────────────────────────────────────────

export const getSeasons = (movieId: string) =>
  prisma.season.findMany({
    where: { movieId },
    orderBy: { number: 'asc' },
    include: { episodes: { orderBy: { number: 'asc' } } },
  })

export const createSeason = async (movieId: string, number: number, title?: string) => {
  await assertMovieExists(movieId)
  return prisma.season.create({ data: { movieId, number, title } })
}

export const updateSeason = async (movieId: string, id: string, data: { number?: number; title?: string }) => {
  await assertSeasonOwnership(movieId, id)
  return prisma.season.update({ where: { id }, data })
}

export const removeSeason = async (movieId: string, id: string) => {
  await assertSeasonOwnership(movieId, id)
  await prisma.season.delete({ where: { id } })
}

// ── Episode ──────────────────────────────────────────────────────────────────

export const getEpisodes = async (movieId: string, seasonId: string) => {
  await assertSeasonOwnership(movieId, seasonId)
  return prisma.episode.findMany({ where: { seasonId }, orderBy: { number: 'asc' } })
}

export const createEpisode = async (movieId: string, seasonId: string, data: {
  number: number
  title: string
  videoUrl?: string
  duration?: number
  thumbnail?: string
}) => {
  await assertSeasonOwnership(movieId, seasonId)
  return prisma.episode.create({ data: { seasonId, ...data } })
}

export const updateEpisode = async (movieId: string, seasonId: string, id: string, data: {
  number?: number
  title?: string
  videoUrl?: string
  duration?: number
  thumbnail?: string
}) => {
  await assertSeasonOwnership(movieId, seasonId)
  await assertEpisodeOwnership(seasonId, id)
  return prisma.episode.update({ where: { id }, data })
}

export const removeEpisode = async (movieId: string, seasonId: string, id: string) => {
  await assertSeasonOwnership(movieId, seasonId)
  await assertEpisodeOwnership(seasonId, id)
  await prisma.episode.delete({ where: { id } })
}
