import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

const MOVIE_SELECT = {
  id: true, title: true, description: true, thumbnail: true, trailerUrl: true,
  type: true, videoUrl: true, duration: true, isPublished: true, createdAt: true,
  genres: { select: { genre: { select: { id: true, name: true } } } },
}

export const getWatchlist = async (userId: string) => {
  const rows = await prisma.watchList.findMany({
    where: { userId, movie: { isPublished: true } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, movie: { select: MOVIE_SELECT } },
  })
  return rows
}

export const getStatus = async (userId: string, movieId: string) => ({
  inWatchlist: Boolean(await prisma.watchList.findUnique({
    where: { userId_movieId: { userId, movieId } },
    select: { movieId: true },
  })),
})

export const addToWatchlist = async (userId: string, movieId: string) => {
  const movie = await prisma.movie.findFirst({ where: { id: movieId, isPublished: true }, select: { id: true } })
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')
  await prisma.watchList.upsert({
    where: { userId_movieId: { userId, movieId } },
    create: { userId, movieId },
    update: {},
  })
  return { inWatchlist: true }
}

export const removeFromWatchlist = async (userId: string, movieId: string) => {
  await prisma.watchList.deleteMany({ where: { userId, movieId } })
  return { inWatchlist: false }
}
