import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, apiBaseUrl } from '@/lib/axios'
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
    <div className="flex min-h-screen items-center justify-center bg-black p-4 sm:p-6"
      style={{ backgroundImage: 'url(/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md rounded-lg bg-black/85 p-6 sm:p-10">
        <h1 className="mb-6 text-3xl font-bold text-red-600 sm:mb-8 sm:text-4xl">{t('common.appName')}</h1>
        <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">{t('auth.register')}</h2>

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
          href={`${apiBaseUrl}/auth/google`}
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
