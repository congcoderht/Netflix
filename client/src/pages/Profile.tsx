import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/axios'
import { getApiErrorMessage } from '@/lib/api-error'

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

type Tab = 'info' | 'password' | 'language'

export default function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const [tab, setTab] = useState<Tab>('info')

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' })
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password form
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [passLoading, setPassLoading] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)
    try {
      const { data } = await api.patch('/auth/profile', profileForm)
      setUser(data)
      setProfileMsg({ type: 'ok', text: 'Cập nhật thành công!' })
    } catch (err: unknown) {
      setProfileMsg({ type: 'err', text: getApiErrorMessage(err, t('common.error')) })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'err', text: 'Mật khẩu nhập lại không khớp' })
      return
    }
    setPassLoading(true)
    setPassMsg(null)
    try {
      await api.patch('/auth/change-password', {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      })
      logout()
      navigate('/login?notice=password_changed', { replace: true })
    } catch (err: unknown) {
      setPassMsg({ type: 'err', text: getApiErrorMessage(err, t('common.error')) })
    } finally {
      setPassLoading(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: t('profile.updateProfile') },
    ...(user?.hasPassword ? [{ key: 'password' as const, label: t('profile.changePassword') }] : []),
    { key: 'language', label: 'Ngôn ngữ' },
  ]

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-5 mb-10">
            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl font-bold text-white overflow-hidden shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.name || 'User'}</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              {user?.role === 'ADMIN' && (
                <span className="mt-1 inline-block text-xs bg-red-600 text-white px-2 py-0.5 rounded">Admin</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-8 gap-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === key
                    ? 'border-red-600 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Profile Info */}
          {tab === 'info' && (
            <form onSubmit={handleProfileSave} className="space-y-5">
              {profileMsg && (
                <div className={`px-4 py-3 rounded text-sm ${profileMsg.type === 'ok' ? 'bg-green-600/20 border border-green-600 text-green-400' : 'bg-red-600/20 border border-red-600 text-red-400'}`}>
                  {profileMsg.text}
                </div>
              )}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">{t('auth.name')}</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-3 outline-none focus:border-gray-400 transition-colors"
                  placeholder="Nhập tên hiển thị"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">URL Avatar</label>
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-3 outline-none focus:border-gray-400 transition-colors"
                  placeholder="https://..."
                />
                {profileForm.avatar && (
                  <img src={profileForm.avatar} alt="preview" className="mt-2 w-12 h-12 rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">{t('auth.email')}</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-gray-900 border border-gray-700 text-gray-500 rounded px-4 py-3 cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={profileLoading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded transition-colors"
              >
                {profileLoading ? t('common.loading') : t('common.save')}
              </button>
            </form>
          )}

          {/* Tab: Change Password */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordSave} className="space-y-5">
              {passMsg && (
                <div className={`px-4 py-3 rounded text-sm ${passMsg.type === 'ok' ? 'bg-green-600/20 border border-green-600 text-green-400' : 'bg-red-600/20 border border-red-600 text-red-400'}`}>
                  {passMsg.text}
                </div>
              )}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">{t('profile.oldPassword')}</label>
                <input
                  type="password"
                  value={passForm.oldPassword}
                  onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-3 outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">{t('profile.newPassword')}</label>
                <input
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-3 outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-3 outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={passLoading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded transition-colors"
              >
                {passLoading ? t('common.loading') : t('profile.changePassword')}
              </button>
            </form>
          )}

          {tab === 'info' && user && !user.hasPassword && (
            <p className="mt-6 rounded border border-blue-700 bg-blue-900/20 px-4 py-3 text-sm text-blue-300">
              Tài khoản này đăng nhập bằng Google nên chưa có mật khẩu riêng.
            </p>
          )}

          {/* Tab: Language */}
          {tab === 'language' && (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">Chọn ngôn ngữ hiển thị cho ứng dụng</p>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg border transition-all ${
                    i18n.language === lang.code
                      ? 'border-red-600 bg-red-600/10 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                  {i18n.language === lang.code && (
                    <svg className="ml-auto w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
