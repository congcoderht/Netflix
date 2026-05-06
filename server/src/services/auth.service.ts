import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util'
import { sendTempPasswordEmail } from '../lib/mailer'
import { config } from '../config'

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000

export const register = async (email: string, password: string, name?: string) => {
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    // Email tồn tại qua OAuth (không có password) → gửi mật khẩu tạm
    if (!existing.password) {
      const tempPassword = crypto.randomBytes(4).toString('hex') // 8 ký tự
      const hashed = await bcrypt.hash(tempPassword, 10)
      await prisma.user.update({ where: { email }, data: { password: hashed } })
      await sendTempPasswordEmail(email, tempPassword)
      throw new Error('OAUTH_ACCOUNT_TEMP_PASSWORD_SENT')
    }
    throw new Error('Email already exists')
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  })

  return buildTokenResponse(user)
}

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Invalid credentials')
  if (!user.password) throw new Error('OAUTH_ACCOUNT')
  if (user.isBlocked) throw new Error('Account is blocked')

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')

  return buildTokenResponse(user)
}

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token)

  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) throw new Error('Invalid refresh token')

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) throw new Error('User not found')

  // Rotate: xóa token cũ, tạo token mới
  await prisma.refreshToken.delete({ where: { token } })
  return buildTokenResponse(user)
}

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } })
}

export const buildTokenResponse = async (user: { id: string; email: string; role: string }) => {
  const payload = { userId: user.id, email: user.email, role: user.role }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  })

  return { accessToken, refreshToken }
}

export const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
  })
}

export const updateProfile = async (userId: string, data: { name?: string; avatar?: string }) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
  })
}

export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.password) throw new Error('Cannot change password for OAuth accounts')

  const valid = await bcrypt.compare(oldPassword, user.password)
  if (!valid) throw new Error('Old password is incorrect')

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
}
