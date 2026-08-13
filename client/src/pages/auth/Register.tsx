import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/axios'
import { getApiErrorBody } from '@/lib/api-error'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/send-otp', {
        email: form.email,
        password: form.password,
        name: form.name,
      })
      navigate('/verify-otp', {
        state: { email: form.email, name: form.name, password: form.password },
      })
    } catch (err: unknown) {
      const error = getApiErrorBody(err)
      if (error.code === 'OAUTH_ACCOUNT') {
        setError('Email này đã đăng nhập bằng Google. Vui lòng đăng nhập bằng Google.')
      } else {
        setError(error.message || t('common.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center"
      style={{ backgroundImage: 'url(/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-black bg-opacity-80 rounded-lg p-10 w-full max-w-md">
        <h1 className="text-red-600 text-4xl font-bold mb-8">{t('common.appName')}</h1>
        <h2 className="text-white text-3xl font-bold mb-6">{t('auth.register')}</h2>

        {error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 rounded px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t('auth.name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-700 text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-400"
          />
          <input
            type="email"
            placeholder={t('auth.email')}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full bg-gray-700 text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="w-full bg-gray-700 text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder={t('auth.confirmPassword')}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            className="w-full bg-gray-700 text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded transition-colors"
          >
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-600" />
          <span className="text-gray-400 text-sm">hoặc</span>
          <div className="flex-1 h-px bg-gray-600" />
        </div>

        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 rounded hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {t('auth.loginWithGoogle')}
        </a>

        <p className="text-gray-400 mt-6 text-sm">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-white hover:underline font-semibold">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
