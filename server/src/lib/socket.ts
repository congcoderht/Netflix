import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { config } from '../config'
import { prisma } from './prisma'
import { verifyAccessToken } from '../utils/jwt.util'

let io: Server | null = null

export const userRoom = (userId: string) => `user:${userId}`

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (typeof token !== 'string' || !token) return next(new Error('UNAUTHORIZED'))

      const payload = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isBlocked: true },
      })
      if (!user || user.isBlocked) return next(new Error('ACCOUNT_UNAVAILABLE'))

      socket.data.userId = user.id
      next()
    } catch {
      next(new Error('TOKEN_EXPIRED'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    void socket.join(userRoom(userId))
  })

  return io
}

export const emitNotification = (userId: string, notification: unknown) => {
  io?.to(userRoom(userId)).emit('notification:new', notification)
}

export const emitNotificationRefresh = (userId: string) => {
  io?.to(userRoom(userId)).emit('notification:refresh')
}

export const disconnectUserSockets = (userId: string) => {
  io?.in(userRoom(userId)).disconnectSockets(true)
}
