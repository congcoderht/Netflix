import { Router } from 'express'
import passport from '../config/passport'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'

export const authRouter = Router()

// OTP
authRouter.post('/send-otp', authController.sendOtp)
authRouter.post('/verify-otp', authController.verifyOtp)

// Email / password
authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.post('/refresh', authController.refreshToken)
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
