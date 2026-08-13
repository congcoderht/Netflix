import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth.store'

export default function OAuthCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    navigate(isAuthenticated() ? '/' : '/login?error=oauth_failed', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-lg">{t('common.loading')}</p>
    </div>
  )
}
