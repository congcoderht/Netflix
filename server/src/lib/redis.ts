import Redis from 'ioredis'
import { config } from '../config'

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
})

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message)
})
