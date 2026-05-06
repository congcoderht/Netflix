import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { email, name, password } = (location.state as any) || {}

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) navigate('/register')
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      const me = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      })
      setAuth(me.data, data.accessToken)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/send-otp', { email, name, password })
      setResendCooldown(60)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-10 w-full max-w-md text-center">
        <h1 className="text-red-600 text-4xl font-bold mb-2">Netflix</h1>
        <h2 className="text-white text-2xl font-bold mb-2">Xác thực email</h2>
        <p className="text-gray-400 text-sm mb-8">
          Nhập mã OTP 6 số đã gửi đến <span className="text-white font-medium">{email}</span>
        </p>

        {error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 rounded px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-red-600 border border-gray-600"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded transition-colors mb-4"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </form>

        <p className="text-gray-400 text-sm">
          Không nhận được mã?{' '}
          {resendCooldown > 0 ? (
            <span className="text-gray-500">Gửi lại sau {resendCooldown}s</span>
          ) : (
            <button onClick={handleResend} className="text-white hover:underline font-medium">
              Gửi lại
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
