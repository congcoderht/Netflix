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

export const checkoutRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: { status: 'error', code: 'CHECKOUT_RATE_LIMITED', message: 'Too many checkout requests. Please try again later.' },
})

export const playbackStartRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 30,
  message: { status: 'error', code: 'PLAYBACK_RATE_LIMITED', message: 'Too many playback requests. Please try again later.' },
})

export const playbackHeartbeatRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 180,
  message: { status: 'error', code: 'HEARTBEAT_RATE_LIMITED', message: 'Too many heartbeat requests.' },
})
