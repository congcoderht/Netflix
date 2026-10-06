import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const links = [
  { to: '/admin', labelKey: 'admin.overview', end: true },
  { to: '/admin/movies', labelKey: 'admin.movies' },
  { to: '/admin/plans', labelKey: 'admin.plans' },
  { to: '/admin/users', labelKey: 'admin.users' },
  { to: '/admin/notifications', labelKey: 'notifications.admin.nav' },
]

export default function AdminNav() {
  const { t } = useTranslation()
  return <nav className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto border-b border-gray-800 px-4 pb-3 sm:mx-0 sm:mt-6 sm:px-0">
    {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm transition sm:text-base ${isActive ? 'bg-gray-800 font-semibold text-white' : 'text-gray-400 hover:text-white'}`}>{t(link.labelKey)}</NavLink>)}
  </nav>
}
