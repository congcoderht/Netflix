import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/admin-user.service'

export const list = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string }
  res.json(await service.listUsers(page, limit, search))
}
export const update = async (req: Request, res: Response) => {
  const actor = req.user as unknown as JwtPayload
  res.json(await service.updateUser(actor.userId, req.params.id as string, req.body))
}
