import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface BackButtonProps {
  fallback: string
  className?: string
}

export default function BackButton({ fallback, className = '' }: BackButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    if (location.key !== 'default' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(fallback)
  }

  return <button
    type="button"
    onClick={goBack}
    className={`fixed left-3 top-[4.5rem] z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#181818]/85 text-gray-300 shadow-lg shadow-black/30 backdrop-blur-md transition duration-200 hover:-translate-x-0.5 hover:border-white/20 hover:bg-[#252525] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:left-5 sm:top-20 ${className}`}
    aria-label={t('common.back')}
    title={t('common.back')}
  >
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
}
