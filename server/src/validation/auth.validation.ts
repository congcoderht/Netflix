import { z } from 'zod'

const email = z.email().trim().toLowerCase().max(254)
const password = z.string().min(6).max(72)

export const sendOtpSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1).max(100).optional(),
})

export const verifyOtpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, 'OTP must contain exactly 6 digits'),
})

export const loginSchema = z.object({ email, password })

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatar: z.union([z.url(), z.literal('')]).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
})

export const changePasswordSchema = z.object({
  oldPassword: password,
  newPassword: password,
}).refine((data) => data.oldPassword !== data.newPassword, {
  path: ['newPassword'],
  message: 'New password must be different from the old password',
})
