import { prisma } from '../lib/prisma'

// ── Season ──────────────────────────────────────────────────────────────────

export const getSeasons = (movieId: string) =>
  prisma.season.findMany({
    where: { movieId },
    orderBy: { number: 'asc' },
    include: { episodes: { orderBy: { number: 'asc' } } },
  })

export const createSeason = (movieId: string, number: number, title?: string) =>
  prisma.season.create({ data: { movieId, number, title } })

export const updateSeason = (id: string, data: { number?: number; title?: string }) =>
  prisma.season.update({ where: { id }, data })

export const removeSeason = async (id: string) => {
  await prisma.season.delete({ where: { id } })
}

// ── Episode ──────────────────────────────────────────────────────────────────

export const getEpisodes = (seasonId: string) =>
  prisma.episode.findMany({ where: { seasonId }, orderBy: { number: 'asc' } })

export const createEpisode = (seasonId: string, data: {
  number: number
  title: string
  videoUrl?: string
  duration?: number
  thumbnail?: string
}) => prisma.episode.create({ data: { seasonId, ...data } })

export const updateEpisode = (id: string, data: {
  number?: number
  title?: string
  videoUrl?: string
  duration?: number
  thumbnail?: string
}) => prisma.episode.update({ where: { id }, data })

export const removeEpisode = async (id: string) => {
  await prisma.episode.delete({ where: { id } })
}
