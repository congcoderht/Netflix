import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { getApiErrorBody } from '@/lib/api-error'

const NOTICES: Record<string, string> = {
  registered: 'Đăng ký thành công! Hãy đăng nhập để tiếp tục.',
  temp_password: 'Tài khoản này đã đăng nhập bằng Google. Chúng tôi đã gửi mật khẩu tạm thời vào email của bạn.',
  password_changed: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
}

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({
    email: params.get('email') || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const notice = params.get('notice')
  const oauthError = params.get('error') === 'oauth_failed'
  const returnTo = params.get('returnTo')
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      const me = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      })
      setAuth(me.data, data.accessToken)
      navigate(safeReturnTo, { replace: true })
    } catch (err: unknown) {
      const error = getApiErrorBody(err)
      if (error.code === 'OAUTH_ACCOUNT') {
        setError('Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút "Đăng nhập với Google".')
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
        <h2 className="text-white text-3xl font-bold mb-6">{t('auth.login')}</h2>

        {notice && NOTICES[notice] && (
          <div className="bg-green-600 bg-opacity-20 border border-green-600 text-green-400 rounded px-4 py-3 mb-4 text-sm">
            {NOTICES[notice]}
          </div>
        )}

        {error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 rounded px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {oauthError && !error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 rounded px-4 py-3 mb-4 text-sm">
            Đăng nhập Google không thành công. Vui lòng thử lại.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            autoFocus={!!params.get('email')}
            className="w-full bg-gray-700 text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded transition-colors"
          >
            {loading ? t('common.loading') : t('auth.login')}
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
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-white hover:underline font-semibold">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
