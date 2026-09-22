import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/movies', label: 'Phim' },
  { to: '/admin/plans', label: 'Gói cước' },
  { to: '/admin/users', label: 'Người dùng' },
]

export default function AdminNav() {
  return <nav className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto border-b border-gray-800 px-4 pb-3 sm:mx-0 sm:mt-6 sm:px-0">
    {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm transition sm:text-base ${isActive ? 'bg-gray-800 font-semibold text-white' : 'text-gray-400 hover:text-white'}`}>{link.label}</NavLink>)}
  </nav>
}
