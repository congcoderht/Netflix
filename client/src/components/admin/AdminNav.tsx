import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/movies', label: 'Phim' },
  { to: '/admin/plans', label: 'Gói cước' },
  { to: '/admin/users', label: 'Người dùng' },
]

export default function AdminNav() {
  return <nav className="mt-6 flex flex-wrap gap-2 border-b border-gray-800 pb-3">
    {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `rounded-lg px-4 py-2 transition ${isActive ? 'bg-gray-800 font-semibold text-white' : 'text-gray-400 hover:text-white'}`}>{link.label}</NavLink>)}
  </nav>
}
