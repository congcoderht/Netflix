import crypto from 'crypto'
import { redis } from '../lib/redis'
import { sendOtpEmail } from '../lib/mailer'
import { prisma } from '../lib/prisma'
import { AppError } from '../errors/app-error'

const OTP_TTL = 10 * 60        // 10 phút (giây)
const RATE_LIMIT_TTL = 60      // 1 phút
const RATE_LIMIT_MAX = 3       // tối đa 3 lần/phút

const otpKey = (email: string) => `otp:${email}`
const rateLimitKey = (email: string) => `otp_rate:${email}`

export const sendOtp = async (email: string, name?: string, password?: string) => {
  // Rate limit: tối đa 3 lần/phút
  const rateLimitKeyStr = rateLimitKey(email)
  const attempts = await redis.incr(rateLimitKeyStr)
  if (attempts === 1) await redis.expire(rateLimitKeyStr, RATE_LIMIT_TTL)
  if (attempts > RATE_LIMIT_MAX) {
    const ttl = await redis.ttl(rateLimitKeyStr)
    throw new AppError(429, `Quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây.`, 'OTP_RATE_LIMITED')
  }

  // Kiểm tra email đã tồn tại chưa
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && existing.password) throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS')
  if (existing && !existing.password) throw new AppError(409, 'Please sign in with Google', 'OAUTH_ACCOUNT')

  // Tạo OTP 6 số
  const otp = crypto.randomInt(100000, 999999).toString()

  // Lưu vào Redis kèm thông tin đăng ký
  await redis.setex(otpKey(email), OTP_TTL, JSON.stringify({ otp, name, password }))

  await sendOtpEmail(email, otp)
}

export const verifyOtp = async (email: string, otp: string) => {
  const raw = await redis.get(otpKey(email))
  if (!raw) throw new AppError(400, 'Mã OTP không tồn tại hoặc đã hết hạn', 'OTP_EXPIRED')

  const { otp: storedOtp, name, password } = JSON.parse(raw)
  if (otp !== storedOtp) throw new AppError(400, 'Mã OTP không đúng', 'INVALID_OTP')

  // Xóa OTP sau khi dùng
  await redis.del(otpKey(email))

  return { name, password }
}
