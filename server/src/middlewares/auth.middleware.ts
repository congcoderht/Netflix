import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.util'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req.user as any)?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden' })
    return
  }
  next()
}
