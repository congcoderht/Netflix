import { Request, Response } from 'express'
import * as genreService from '../services/genre.service'

export const getAll = async (_req: Request, res: Response) => {
  res.json(await genreService.getAll())
}

export const create = async (req: Request, res: Response) => {
  const genre = await genreService.create(req.body.name)
  res.status(201).json(genre)
}

export const update = async (req: Request, res: Response) => {
  const genre = await genreService.update(req.params.id as string, req.body.name)
  res.json(genre)
}

export const findOrCreate = async (req: Request, res: Response) => {
  res.json(await genreService.findOrCreate(req.body.name))
}

export const remove = async (req: Request, res: Response) => {
  await genreService.remove(req.params.id as string)
  res.status(204).send()
}
