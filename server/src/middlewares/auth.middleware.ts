import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.util'
import { prisma } from '../lib/prisma'
import { JwtPayload } from '../utils/jwt.util'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, role: true, isBlocked: true },
    })

    if (!user || user.isBlocked) {
      res.status(401).json({ message: 'Account is unavailable' })
      return
    }

    // Use current database values so role changes and account blocks take
    // effect without waiting for the access token to expire.
    req.user = { userId: payload.userId, email: user.email, role: user.role }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req.user as JwtPayload | undefined)?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden' })
    return
  }
  next()
}
