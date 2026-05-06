import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from '../config'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export const generateAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwt.accessSecret as string, { expiresIn: '15m' } as SignOptions)

export const generateRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwt.refreshSecret as string, { expiresIn: '7d' } as SignOptions)

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.jwt.accessSecret as string) as JwtPayload

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwt.refreshSecret as string) as JwtPayload
