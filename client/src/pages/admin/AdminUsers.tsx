import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/api-error'
import { getAdminUsers, updateAdminUser, type AdminUser } from '@/services/admin-user.service'

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    getAdminUsers(page, search)
      .then((result) => { if (active) { setUsers(result.items); setTotalPages(result.totalPages) } })
      .catch((error) => { if (active) setToast(getApiErrorMessage(error, 'Không thể tải người dùng')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search])

  const updateBlockStatus = async (user: AdminUser) => {
    try {
      const result = await updateAdminUser(user.id, { isBlocked: !user.isBlocked })
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, ...result } : item))
      setToast('Đã cập nhật tài khoản')
    } catch (error) {
      setToast(getApiErrorMessage(error, 'Không thể cập nhật tài khoản'))
    }
  }

  return <>
    <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()) }} className="flex max-w-xl flex-col gap-2 sm:flex-row">
      <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white outline-none focus:border-red-500" />
      <button className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white sm:shrink-0">Tìm kiếm</button>
    </form>

    {loading ? <p className="py-20 text-center text-gray-400">Đang tải...</p> : <div className="mt-6 overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-gray-900 text-gray-400"><tr><th className="p-4">Người dùng</th><th className="p-4">Role</th><th className="p-4">Gói hiện tại</th><th className="p-4">Giao dịch</th><th className="p-4">Ngày tạo</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead>
        <tbody className="divide-y divide-gray-800 text-gray-300">{users.map((user) => <tr key={user.id}>
          <td className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-red-600 font-bold text-white">{user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user.name?.[0] || user.email[0]).toUpperCase()}</div><div><p className="font-semibold text-white">{user.name || 'Chưa đặt tên'}</p><p className="text-xs text-gray-500">{user.email}</p></div></div></td>
          <td className="p-4"><span className={user.role === 'ADMIN' ? 'text-red-400' : ''}>{user.role}</span></td>
          <td className="p-4">{user.subscription ? <><span className="text-white">{user.subscription.plan.name}</span><span className="block text-xs text-gray-500">đến {new Date(user.subscription.expiresAt).toLocaleDateString('vi-VN')}</span></> : <span className="text-gray-500">Chưa có gói</span>}</td>
          <td className="p-4">{user._count.payments}</td><td className="p-4">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
          <td className="p-4"><span className={user.isBlocked ? 'text-red-400' : 'text-green-400'}>{user.isBlocked ? 'Đã khóa' : 'Hoạt động'}</span></td>
          <td className="p-4"><div className="flex justify-end"><button onClick={() => void updateBlockStatus(user)} className="rounded bg-gray-700 px-3 py-2 hover:bg-gray-600">{user.isBlocked ? 'Mở khóa' : 'Khóa'}</button></div></td>
        </tr>)}</tbody>
      </table>{!users.length && <p className="py-12 text-center text-gray-500">Không tìm thấy người dùng</p>}
    </div>}

    {totalPages > 1 && <div className="mt-6 flex justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-40">Trước</button><span className="px-3 py-2 text-gray-400">{page}/{totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-40">Sau</button></div>}
    {toast && <div role="status" className="fixed left-4 right-4 top-20 z-[60] rounded-xl border border-gray-700 bg-gray-900 px-5 py-4 text-white shadow-2xl sm:left-auto sm:right-5 sm:max-w-sm">{toast}<button onClick={() => setToast('')} className="ml-4 text-gray-400">×</button></div>}
  </>
}
