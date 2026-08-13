import { Request, Response } from 'express'
import * as movieService from '../services/movie.service'
import { ContentType } from '@prisma/client'
import { AppError } from '../errors/app-error'
import { JwtPayload } from '../utils/jwt.util'

export const getList = async (req: Request, res: Response) => {
  const { type, genreId, search, page, limit } = req.query
  const isAdmin = (req.user as unknown as JwtPayload | undefined)?.role === 'ADMIN'

  const result = await movieService.getList({
    type: type as ContentType | undefined,
    genreId: genreId as string | undefined,
    search: search as string | undefined,
    page: page as unknown as number,
    limit: limit as unknown as number,
    published: isAdmin ? undefined : true,
  })
  res.json(result)
}

export const getById = async (req: Request, res: Response) => {
  const isAdmin = (req.user as unknown as JwtPayload | undefined)?.role === 'ADMIN'
  const movie = await movieService.getById(req.params.id as string, isAdmin)
  if (!movie) throw new AppError(404, 'Movie not found', 'MOVIE_NOT_FOUND')
  res.json(movie)
}

export const create = async (req: Request, res: Response) => {
  const { title, description, thumbnail, trailerUrl, type, videoUrl, duration, isPublished, genreIds } = req.body
  const movie = await movieService.create({ title, description, thumbnail, trailerUrl, type, videoUrl, duration, isPublished, genreIds })
  res.status(201).json(movie)
}

export const update = async (req: Request, res: Response) => {
  const movie = await movieService.update(req.params.id as string, req.body)
  res.json(movie)
}

export const remove = async (req: Request, res: Response) => {
  await movieService.remove(req.params.id as string)
  res.status(204).send()
}

export const searchActors = async (req: Request, res: Response) => {
  const actors = await movieService.searchActors((req.query.q as string) || '')
  res.json(actors)
}

export const createActor = async (req: Request, res: Response) => {
  const { name, avatar, bio } = req.body
  const actor = await movieService.upsertActor({ name, avatar, bio })
  res.status(201).json(actor)
}

export const setMovieActors = async (req: Request, res: Response) => {
  const { actors } = req.body
  await movieService.setMovieActors(req.params.id as string, actors)
  res.json({ message: 'ok' })
}
