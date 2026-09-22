import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const adminDashboardQuerySchema = z.object({
  period: z.enum(['month', 'year']).default('month'),
  year: z.coerce.number().int().min(2020).max(currentYear + 1).default(currentYear),
  month: z.coerce.number().int().min(1).max(12).optional(),
})
