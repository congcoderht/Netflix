import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/watch-history.service'

const userIdFrom = (req: Request) => (req.user as unknown as JwtPayload).userId

export const getHistory = async (req: Request, res: Response) => {
  res.json(await service.getHistory(
    userIdFrom(req),
    req.query.page as unknown as number,
    req.query.limit as unknown as number,
  ))
}

export const removeHistoryItem = async (req: Request, res: Response) => {
  await service.removeHistoryItem(userIdFrom(req), req.params.id as string)
  res.status(204).send()
}

export const clearHistory = async (req: Request, res: Response) => {
  res.json(await service.clearHistory(userIdFrom(req)))
}
