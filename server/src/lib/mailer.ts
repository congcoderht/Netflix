import nodemailer from 'nodemailer'
import { config } from '../config'

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
})

export const sendOtpEmail = async (to: string, otp: string) => {
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Mã xác thực OTP - Netflix',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#141414;color:#fff;padding:32px;border-radius:8px">
        <h1 style="color:#e50914;margin-bottom:8px">Netflix</h1>
        <h2 style="margin-bottom:16px">Xác thực tài khoản</h2>
        <p style="color:#ccc">Mã OTP của bạn là:</p>
        <div style="background:#333;padding:16px;border-radius:6px;text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px">${otp}</span>
        </div>
        <p style="color:#ccc">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
        <p style="color:#999;font-size:12px;margin-top:32px">Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
      </div>
    `,
  })
}

export const sendTempPasswordEmail = async (to: string, tempPassword: string) => {
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Mật khẩu tạm thời - Netflix',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#141414;color:#fff;padding:32px;border-radius:8px">
        <h1 style="color:#e50914;margin-bottom:8px">Netflix</h1>
        <h2 style="margin-bottom:16px">Mật khẩu tạm thời của bạn</h2>
        <p style="color:#ccc">Tài khoản của bạn hiện đang đăng nhập bằng Google. Dưới đây là mật khẩu tạm thời để bạn có thể đăng nhập bằng email:</p>
        <div style="background:#333;padding:16px;border-radius:6px;text-align:center;margin:24px 0">
          <span style="font-size:24px;font-weight:bold;letter-spacing:4px">${tempPassword}</span>
        </div>
        <p style="color:#ccc">Sau khi đăng nhập, hãy vào <strong>Hồ sơ → Đổi mật khẩu</strong> để đặt mật khẩu mới.</p>
        <p style="color:#999;font-size:12px;margin-top:32px">Nếu bạn không yêu cầu email này, hãy bỏ qua.</p>
      </div>
    `,
  })
}
