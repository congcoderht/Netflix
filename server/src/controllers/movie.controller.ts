import { Request, Response } from 'express'
import * as movieService from '../services/movie.service'
import { ContentType } from '@prisma/client'

export const getList = async (req: Request, res: Response) => {
  try {
    const { type, genreId, search, page, limit } = req.query
    const isAdmin = (req.user as any)?.role === 'ADMIN'

    const result = await movieService.getList({
      type: type as ContentType,
      genreId: genreId as string,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      published: isAdmin ? undefined : true,
    })
    res.json(result)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const isAdmin = (req.user as any)?.role === 'ADMIN'
    const movie = await movieService.getById(req.params.id as string, isAdmin)
    if (!movie) { res.status(404).json({ message: 'Movie not found' }); return }
    res.json(movie)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnail, trailerUrl, type, videoUrl, duration, isPublished, genreIds } = req.body
    if (!title || !type) { res.status(400).json({ message: 'Title and type are required' }); return }
    const movie = await movieService.create({ title, description, thumbnail, trailerUrl, type, videoUrl, duration, isPublished, genreIds })
    res.status(201).json(movie)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const movie = await movieService.update(req.params.id as string, req.body)
    res.json(movie)
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Movie not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    await movieService.remove(req.params.id as string)
    res.status(204).send()
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Movie not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const searchActors = async (req: Request, res: Response) => {
  try {
    const actors = await movieService.searchActors((req.query.q as string) || '')
    res.json(actors)
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export const createActor = async (req: Request, res: Response) => {
  try {
    const { name, avatar, bio } = req.body
    if (!name) { res.status(400).json({ message: 'Name is required' }); return }
    const actor = await movieService.upsertActor({ name, avatar, bio })
    res.status(201).json(actor)
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export const setMovieActors = async (req: Request, res: Response) => {
  try {
    const { actors } = req.body
    await movieService.setMovieActors(req.params.id as string, actors || [])
    res.json({ message: 'ok' })
  } catch { res.status(500).json({ message: 'Server error' }) }
}
