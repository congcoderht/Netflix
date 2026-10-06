import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/notification.service'

const userIdFrom = (req: Request) => (req.user as unknown as JwtPayload).userId

export const list = async (req: Request, res: Response) => {
  const { cursor, limit, unreadOnly } = req.query as unknown as {
    cursor?: string
    limit: number
    unreadOnly: 'true' | 'false'
  }
  const result = await service.listNotifications(userIdFrom(req), limit, cursor, unreadOnly === 'true')
  res.json({ ...result, unreadCount: await service.unreadCount(userIdFrom(req)) })
}

export const countUnread = async (req: Request, res: Response) => {
  res.json({ count: await service.unreadCount(userIdFrom(req)) })
}

export const markRead = async (req: Request, res: Response) => {
  res.json(await service.markRead(userIdFrom(req), req.params.id as string))
}

export const markAllRead = async (req: Request, res: Response) => {
  res.json(await service.markAllRead(userIdFrom(req)))
}

export const remove = async (req: Request, res: Response) => {
  await service.removeNotification(userIdFrom(req), req.params.id as string)
  res.status(204).send()
}

export const broadcast = async (req: Request, res: Response) => {
  const { expiresAt, ...input } = req.body
  res.status(201).json(await service.broadcastSystemNotification({
    ...input,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }))
}
