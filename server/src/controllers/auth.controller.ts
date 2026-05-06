import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import * as otpService from '../services/otp.service'
import { config } from '../config'
import { JwtPayload } from '../utils/jwt.util'

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }
    await otpService.sendOtp(email, name, password)
    res.json({ message: 'OTP sent' })
  } catch (err: any) {
    if (err.message === 'OAUTH_ACCOUNT') {
      res.status(409).json({ code: 'OAUTH_ACCOUNT', message: 'Tài khoản này đăng nhập bằng Google. Vui lòng đăng nhập bằng Google.' })
      return
    }
    res.status(400).json({ message: err.message })
  }
}

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' })
      return
    }
    const { name, password } = await otpService.verifyOtp(email, otp)
    const tokens = await authService.register(email, password, name)
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.status(201).json({ accessToken: tokens.accessToken })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }
    const tokens = await authService.register(email, password, name)
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.status(201).json({ accessToken: tokens.accessToken })
  } catch (err: any) {
    if (err.message === 'OAUTH_ACCOUNT_TEMP_PASSWORD_SENT') {
      res.status(200).json({ code: 'TEMP_PASSWORD_SENT' })
      return
    }
    res.status(400).json({ message: err.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }
    const tokens = await authService.login(email, password)
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.json({ accessToken: tokens.accessToken })
  } catch (err: any) {
    if (err.message === 'OAUTH_ACCOUNT') {
      res.status(403).json({ code: 'OAUTH_ACCOUNT', message: 'Tài khoản này đăng nhập bằng Google. Vui lòng đăng nhập bằng Google.' })
      return
    }
    res.status(401).json({ message: err.message })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      res.status(401).json({ message: 'No refresh token' })
      return
    }
    const tokens = await authService.refreshTokens(token)
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.json({ accessToken: tokens.accessToken })
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) await authService.logout(token)
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out' })
  } catch {
    res.status(500).json({ message: 'Logout failed' })
  }
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe((req.user as unknown as JwtPayload).userId)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, avatar } = req.body
    const userId = (req.user as unknown as JwtPayload).userId
    const user = await authService.updateProfile(userId, { name, avatar })
    res.json(user)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: 'Old and new password are required' })
      return
    }
    const userId = (req.user as unknown as JwtPayload).userId
    await authService.changePassword(userId, oldPassword, newPassword)
    res.json({ message: 'Password changed successfully' })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const tokens = await authService.buildTokenResponse({ id: user.id, email: user.email, role: user.role })
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.redirect(`${config.clientUrl}/oauth/callback?token=${tokens.accessToken}`)
  } catch {
    res.redirect(`${config.clientUrl}/login?error=oauth_failed`)
  }
}

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}
