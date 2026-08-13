import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import * as otpService from '../services/otp.service'
import { config } from '../config'
import { JwtPayload } from '../utils/jwt.util'
import { AppError } from '../errors/app-error'

const currentUserId = (req: Request) =>
  (req.user as unknown as JwtPayload).userId

export const sendOtp = async (req: Request, res: Response) => {
  const { email, name, password } = req.body
  await otpService.sendOtp(email, name, password)
  res.json({ message: 'OTP sent' })
}

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body
  const { name, password } = await otpService.verifyOtp(email, otp)
  const tokens = await authService.register(email, password, name)
  setRefreshTokenCookie(res, tokens.refreshToken)
  res.status(201).json({ accessToken: tokens.accessToken })
}

export const login = async (req: Request, res: Response) => {
  const tokens = await authService.login(req.body.email, req.body.password)
  setRefreshTokenCookie(res, tokens.refreshToken)
  res.json({ accessToken: tokens.accessToken })
}

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken
  if (!token) throw new AppError(401, 'No refresh token', 'REFRESH_TOKEN_MISSING')

  try {
    const tokens = await authService.refreshTokens(token)
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.json({ accessToken: tokens.accessToken })
  } catch (error) {
    clearRefreshTokenCookie(res)
    throw error
  }
}

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken
  if (token) await authService.logout(token)
  clearRefreshTokenCookie(res)
  res.json({ message: 'Logged out' })
}

export const getMe = async (req: Request, res: Response) => {
  const user = await authService.getMe(currentUserId(req))
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
  res.json(user)
}

export const updateProfile = async (req: Request, res: Response) => {
  res.json(await authService.updateProfile(currentUserId(req), req.body))
}

export const changePassword = async (req: Request, res: Response) => {
  await authService.changePassword(currentUserId(req), req.body.oldPassword, req.body.newPassword)
  clearRefreshTokenCookie(res)
  res.json({ message: 'Password changed successfully. Please sign in again.' })
}

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as unknown as { id: string; email: string; role: string }
    const tokens = await authService.buildTokenResponse(user)
    setRefreshTokenCookie(res, tokens.refreshToken)
    // The access token is restored by AuthBootstrap through the HTTP-only
    // refresh cookie, so it never needs to appear in browser history or logs.
    res.redirect(`${config.clientUrl}/oauth/callback`)
  } catch {
    res.redirect(`${config.clientUrl}/login?error=oauth_failed`)
  }
}

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
}

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    ...refreshTokenCookieOptions,
    maxAge: config.jwt.refreshExpiresInMs,
  })
}

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', refreshTokenCookieOptions)
}
