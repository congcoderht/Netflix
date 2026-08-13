import { Router } from 'express'
import passport from '../config/passport'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import {
  loginRateLimit,
  otpRateLimit,
  refreshRateLimit,
} from '../middlewares/rate-limit.middleware'

export const authRouter = Router()

// OTP
authRouter.post('/send-otp', otpRateLimit, authController.sendOtp)
authRouter.post('/verify-otp', otpRateLimit, authController.verifyOtp)

// Email / password. Account creation is completed only through verify-otp;
// exposing a direct register endpoint would bypass email verification.
authRouter.post('/login', loginRateLimit, authController.login)
authRouter.post('/refresh', refreshRateLimit, authController.refreshToken)
authRouter.post('/logout', authController.logout)

// User info (protected)
authRouter.get('/me', authenticate, authController.getMe)
authRouter.patch('/profile', authenticate, authController.updateProfile)
authRouter.patch('/change-password', authenticate, authController.changePassword)

// Google OAuth
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
authRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
)
