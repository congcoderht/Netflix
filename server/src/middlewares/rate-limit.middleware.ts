import rateLimit from 'express-rate-limit'

const commonOptions = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
}

export const loginRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many login attempts. Please try again later.' },
})

export const otpRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many OTP requests. Please try again later.' },
})

export const refreshRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 5 * 60 * 1000,
  limit: 60,
  message: { message: 'Too many refresh requests. Please try again later.' },
})
