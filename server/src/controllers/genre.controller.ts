import { Request, Response } from 'express'
import * as genreService from '../services/genre.service'

export const getAll = async (_req: Request, res: Response) => {
  try {
    const genres = await genreService.getAll()
    res.json(genres)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { name } = req.body
    if (!name) { res.status(400).json({ message: 'Name is required' }); return }
    const genre = await genreService.create(name)
    res.status(201).json(genre)
  } catch (err: any) {
    if (err.code === 'P2002') { res.status(409).json({ message: 'Genre already exists' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { name } = req.body
    if (!name) { res.status(400).json({ message: 'Name is required' }); return }
    const genre = await genreService.update(req.params.id as string, name)
    res.json(genre)
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Genre not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const findOrCreate = async (req: Request, res: Response) => {
  try {
    const { name } = req.body
    if (!name) { res.status(400).json({ message: 'Name is required' }); return }
    const genre = await genreService.findOrCreate(name)
    res.json(genre)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    await genreService.remove(req.params.id as string)
    res.status(204).send()
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Genre not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}
