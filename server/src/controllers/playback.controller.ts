import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/playback.service'

const userFrom = (req: Request) => req.user as unknown as JwtPayload

export const start = async (req: Request, res: Response) => {
  const user = userFrom(req)
  res.status(201).json(await service.startPlayback(user.userId, user.role, req.body.movieId, req.body.episodeId, req.body.deviceId))
}
export const heartbeat = async (req: Request, res: Response) => {
  await service.heartbeat(userFrom(req).userId, req.params.id as string)
  res.status(204).send()
}
export const end = async (req: Request, res: Response) => {
  await service.endPlayback(userFrom(req).userId, req.params.id as string)
  res.status(204).send()
}
