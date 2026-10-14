import { Request, Response } from 'express'
import { chat } from '../services/chat.service'
import { JwtPayload } from '../utils/jwt.util'
import { ChatRequest } from '../validation/chat.validation'

export const respond = async (req: Request, res: Response) => {
  const { messages } = req.body as ChatRequest
  const user = req.user as unknown as JwtPayload
  res.json(await chat({ userId: user.userId, role: user.role }, messages))
}
