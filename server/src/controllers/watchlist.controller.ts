import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/watchlist.service'

const userIdFrom = (req: Request) => (req.user as unknown as JwtPayload).userId

export const getWatchlist = async (req: Request, res: Response) => {
  res.json(await service.getWatchlist(userIdFrom(req)))
}

export const getStatus = async (req: Request, res: Response) => {
  res.json(await service.getStatus(userIdFrom(req), req.params.movieId as string))
}

export const addToWatchlist = async (req: Request, res: Response) => {
  res.status(201).json(await service.addToWatchlist(userIdFrom(req), req.params.movieId as string))
}

export const removeFromWatchlist = async (req: Request, res: Response) => {
  res.json(await service.removeFromWatchlist(userIdFrom(req), req.params.movieId as string))
}
