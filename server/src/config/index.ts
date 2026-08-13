import dotenv from 'dotenv';

dotenv.config();

const durationToMs = (value: string) => {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value)
  if (!match) throw new Error(`Invalid duration: ${value}`)

  const amount = Number(match[1])
  const multipliers = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return amount * multipliers[match[2] as keyof typeof multipliers]
}

const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-prod',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn,
    refreshExpiresInMs: durationToMs(refreshExpiresIn),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Netflix <no-reply@netflix.com>',
  },
};

export const validateConfig = () => {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  if (config.nodeEnv === 'production') {
    const insecureSecrets = [
      config.jwt.accessSecret,
      config.jwt.refreshSecret,
    ].some((secret) => !secret || secret.includes('change-in-prod'))

    if (insecureSecrets) {
      throw new Error('Secure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production')
    }
  }
}
