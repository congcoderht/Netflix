import { z } from 'zod'
import { resourceIdSchema } from './common.validation'

export const notificationListQuerySchema = z.object({
  cursor: resourceIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.enum(['true', 'false']).default('false'),
})

export const notificationParamsSchema = z.object({ id: resourceIdSchema })

const optionalInternalPath = z.string()
  .trim()
  .max(500)
  .regex(/^\/(?!\/)/, 'Only internal application paths are allowed')
  .optional()
  .nullable()

export const systemNotificationSchema = z.object({
  titleVi: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  bodyVi: z.string().trim().min(1).max(500),
  bodyEn: z.string().trim().min(1).max(500),
  actionUrl: optionalInternalPath,
  expiresAt: z.iso.datetime().optional().nullable(),
})
