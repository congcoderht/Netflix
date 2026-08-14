import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util'
import { sendTempPasswordEmail } from '../lib/mailer'
import { AppError } from '../errors/app-error'
import { config } from '../config'

const hashRefreshToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex')

const issueTokens = (user: { id: string; email: string; role: string }) => {
  const payload = { userId: user.id, email: user.email, role: user.role }
  const refreshToken = generateRefreshToken(payload)
  return {
    accessToken: generateAccessToken(payload),
    refreshToken,
    refreshTokenHash: hashRefreshToken(refreshToken),
  }
}

export const register = async (email: string, password: string, name?: string) => {
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    // Email tồn tại qua OAuth (không có password) → gửi mật khẩu tạm
    if (!existing.password) {
      const tempPassword = crypto.randomBytes(4).toString('hex') // 8 ký tự
      const hashed = await bcrypt.hash(tempPassword, 10)
      await prisma.user.update({ where: { email }, data: { password: hashed } })
      await sendTempPasswordEmail(email, tempPassword)
      throw new AppError(409, 'A temporary password was sent to your email', 'TEMP_PASSWORD_SENT')
    }
    throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS')
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  })

  return buildTokenResponse(user)
}

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
  if (!user.password) throw new AppError(403, 'Please sign in with Google', 'OAUTH_ACCOUNT')
  if (user.isBlocked) throw new AppError(403, 'Account is blocked', 'ACCOUNT_BLOCKED')

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')

  return buildTokenResponse(user)
}

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token)
  const tokenHash = hashRefreshToken(token)
  const now = new Date()

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!stored) throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN')

  if (stored.usedAt || stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: now },
    })
    throw new AppError(401, 'Refresh token reuse detected. Please sign in again.', 'REFRESH_TOKEN_REUSE')
  }

  if (stored.expiresAt < now) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: now },
    })
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) throw new AppError(401, 'User not found', 'USER_NOT_FOUND')
  if (user.isBlocked) {
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } })
    throw new AppError(403, 'Account is blocked', 'ACCOUNT_BLOCKED')
  }

  const next = issueTokens(user)
  const rotated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { id: stored.id, usedAt: null, revokedAt: null },
      data: { usedAt: now, replacedByTokenHash: next.refreshTokenHash },
    })
    if (claimed.count !== 1) return false

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: next.refreshTokenHash,
        familyId: stored.familyId,
        expiresAt: new Date(Date.now() + config.jwt.refreshExpiresInMs),
      },
    })
    return true
  })

  if (!rotated) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    throw new AppError(401, 'Refresh token reuse detected. Please sign in again.', 'REFRESH_TOKEN_REUSE')
  }

  return { accessToken: next.accessToken, refreshToken: next.refreshToken }
}

export const logout = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    select: { familyId: true },
  })
  if (!stored) return
  await prisma.refreshToken.updateMany({
    where: { familyId: stored.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export const buildTokenResponse = async (user: { id: string; email: string; role: string }) => {
  const tokens = issueTokens(user)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: tokens.refreshTokenHash,
      familyId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + config.jwt.refreshExpiresInMs),
    },
  })

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
}

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, role: true, password: true, createdAt: true },
  })
  if (!user) return null
  const { password, ...safeUser } = user
  return { ...safeUser, hasPassword: Boolean(password) }
}

export const updateProfile = async (userId: string, data: { name?: string; avatar?: string }) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, avatar: true, role: true, password: true, createdAt: true },
  })
  const { password, ...safeUser } = user
  return { ...safeUser, hasPassword: Boolean(password) }
}

export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.password) throw new AppError(400, 'Cannot change password for OAuth accounts', 'OAUTH_ACCOUNT')

  const valid = await bcrypt.compare(oldPassword, user.password)
  if (!valid) throw new AppError(400, 'Old password is incorrect', 'INVALID_OLD_PASSWORD')

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: hashed } }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])
}
