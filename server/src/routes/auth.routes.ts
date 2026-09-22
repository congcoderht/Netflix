import { Router } from 'express'
import passport, { isGoogleOAuthConfigured } from '../config/passport'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import {
  loginRateLimit,
  otpRateLimit,
  refreshRateLimit,
} from '../middlewares/rate-limit.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import {
  changePasswordSchema,
  loginSchema,
  profileUpdateSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../validation/auth.validation'
import { config } from '../config'

export const authRouter = Router()

// OTP
authRouter.post('/send-otp', otpRateLimit, validate(sendOtpSchema), asyncHandler(authController.sendOtp))
authRouter.post('/verify-otp', otpRateLimit, validate(verifyOtpSchema), asyncHandler(authController.verifyOtp))

// Email / password. Account creation is completed only through verify-otp;
// exposing a direct register endpoint would bypass email verification.
authRouter.post('/login', loginRateLimit, validate(loginSchema), asyncHandler(authController.login))
authRouter.post('/refresh', refreshRateLimit, asyncHandler(authController.refreshToken))
authRouter.post('/logout', asyncHandler(authController.logout))

// User info (protected)
authRouter.get('/me', authenticate, asyncHandler(authController.getMe))
authRouter.patch('/profile', authenticate, validate(profileUpdateSchema), asyncHandler(authController.updateProfile))
authRouter.patch('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword))

// Google OAuth is optional so builds, tests and password login do not depend on
// external credentials. Both endpoints clearly report when it is unavailable.
if (isGoogleOAuthConfigured) {
  authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
  authRouter.get('/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${config.clientUrl}/login?error=oauth_failed`,
    }),
    authController.googleCallback
  )
} else {
  const googleOAuthUnavailable = (_req: import('express').Request, res: import('express').Response) => {
    res.status(503).json({
      status: 'error',
      code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
      message: 'Google sign-in is not configured',
    })
  }
  authRouter.get('/google', googleOAuthUnavailable)
  authRouter.get('/google/callback', googleOAuthUnavailable)
}
