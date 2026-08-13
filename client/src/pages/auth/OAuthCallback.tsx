import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'

export default function OAuthCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      navigate('/login')
      return
    }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAuth(data, token)
        navigate('/')
      })
      .catch(() => navigate('/login'))
  }, [navigate, params, setAuth])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-lg">{t('common.loading')}</p>
    </div>
  )
}
