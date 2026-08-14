import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as watchProgressService from '../services/watch-progress.service'

const userIdFrom = (req: Request) => (req.user as unknown as JwtPayload).userId

export const getContinueWatching = async (req: Request, res: Response) => {
  res.json(await watchProgressService.getContinueWatching(
    userIdFrom(req),
    req.query.limit as unknown as number,
  ))
}

export const getProgress = async (req: Request, res: Response) => {
  res.json(await watchProgressService.getProgress(
    userIdFrom(req),
    req.params.movieId as string,
    req.query.episodeId as string | undefined,
  ))
}

export const saveProgress = async (req: Request, res: Response) => {
  res.json(await watchProgressService.saveProgress(
    userIdFrom(req),
    req.params.movieId as string,
    req.body.episodeId,
    req.body.progressSec,
  ))
}
