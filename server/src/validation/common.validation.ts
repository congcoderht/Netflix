import { z } from 'zod'

// Prisma IDs are strings. Production rows use generated UUIDs, while seeded
// development data intentionally uses readable IDs such as movie-avengers-001.
export const resourceIdSchema = z.string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Invalid resource ID')
