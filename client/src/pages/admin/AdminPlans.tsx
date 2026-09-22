import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/api-error'
import { createAdminPlan, getAdminPlans, updateAdminPlan, type AdminPlan, type AdminPlanInput } from '@/services/admin-plan.service'

const emptyForm: AdminPlanInput = {
  code: '', name: '', price: 0, currency: 'VND', durationDays: 30,
  description: null, maxScreens: 1, sortOrder: 0, isActive: true,
}
const money = (amount: number, currency: string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)

export default function AdminPlans() {
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [editing, setEditing] = useState<AdminPlan | null>(null)
  const [form, setForm] = useState<AdminPlanInput>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const load = () => getAdminPlans()
    .then(setPlans)
    .catch((error) => setToast(getApiErrorMessage(error, 'Không thể tải danh sách gói')))
    .finally(() => setLoading(false))

  useEffect(() => { void load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (plan: AdminPlan) => {
    setEditing(plan)
    setForm({
      code: plan.code, name: plan.name, price: plan.price, currency: plan.currency,
      durationDays: plan.durationDays, description: plan.description,
      maxScreens: plan.maxScreens, sortOrder: plan.sortOrder, isActive: plan.isActive,
    })
    setModalOpen(true)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) await updateAdminPlan(editing.id, form)
      else await createAdminPlan(form)
      setModalOpen(false)
      setToast(editing ? 'Đã cập nhật gói cước' : 'Đã tạo gói cước')
      await load()
    } catch (error) {
      setToast(getApiErrorMessage(error, 'Không thể lưu gói cước'))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (plan: AdminPlan) => {
    try {
      const updated = await updateAdminPlan(plan.id, { isActive: !plan.isActive })
      setPlans((items) => items.map((item) => item.id === updated.id ? updated : item))
      setToast(updated.isActive ? 'Đã mở bán gói' : 'Đã ngừng bán gói')
    } catch (error) {
      setToast(getApiErrorMessage(error, 'Không thể thay đổi trạng thái gói'))
    }
  }

  const numberField = (key: 'price' | 'durationDays' | 'maxScreens' | 'sortOrder', label: string, min: number) => <label className="block">
    <span className="mb-1 block text-sm text-gray-300">{label}</span>
    <input type="number" min={min} required value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white outline-none focus:border-red-500" />
  </label>

  return <>
        <div className="flex justify-end">
          <button onClick={openCreate} className="rounded-lg bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">+ Thêm gói</button>
        </div>

        {loading ? <p className="py-20 text-center text-gray-400">Đang tải...</p> : <div className="mt-6 overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-900 text-gray-400"><tr><th className="p-4">Gói</th><th className="p-4">Giá / thời hạn</th><th className="p-4">Màn hình</th><th className="p-4">Subscription</th><th className="p-4">Giao dịch</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-gray-800 text-gray-200">{plans.map((plan) => <tr key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
              <td className="p-4"><strong className="block text-white">{plan.name}</strong><span className="text-xs text-gray-500">{plan.code}</span></td>
              <td className="p-4">{money(plan.price, plan.currency)}<span className="block text-xs text-gray-500">{plan.durationDays} ngày</span></td>
              <td className="p-4">{plan.maxScreens}</td><td className="p-4">{plan._count.subscriptions}</td><td className="p-4">{plan._count.payments}</td>
              <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.isActive ? 'bg-green-950 text-green-300' : 'bg-gray-800 text-gray-400'}`}>{plan.isActive ? 'Đang bán' : 'Đã ẩn'}</span></td>
              <td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(plan)} className="rounded bg-gray-700 px-3 py-2 hover:bg-gray-600">Sửa</button><button onClick={() => void toggleActive(plan)} className="rounded bg-red-950 px-3 py-2 text-red-300 hover:bg-red-900">{plan.isActive ? 'Ngừng bán' : 'Mở bán'}</button></div></td>
            </tr>)}</tbody>
          </table>
        </div>}
    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={() => !saving && setModalOpen(false)}>
      <form onSubmit={(event) => void save(event)} onMouseDown={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="flex justify-between gap-4"><h2 className="text-2xl font-bold text-white">{editing ? 'Chỉnh sửa gói' : 'Thêm gói mới'}</h2><button type="button" onClick={() => setModalOpen(false)} className="text-2xl text-gray-400">×</button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-sm text-gray-300">Mã gói</span><input required maxLength={30} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-red-500" /></label>
          <label className="block"><span className="mb-1 block text-sm text-gray-300">Tên gói</span><input required maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-red-500" /></label>
          {numberField('price', 'Giá', 0)}{numberField('durationDays', 'Thời hạn (ngày)', 1)}{numberField('maxScreens', 'Số màn hình', 1)}{numberField('sortOrder', 'Thứ tự hiển thị', 0)}
          <label className="block"><span className="mb-1 block text-sm text-gray-300">Tiền tệ</span><input required maxLength={3} value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-red-500" /></label>
          <label className="flex items-center gap-3 pt-7 text-white"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-5 w-5 accent-red-600" />Mở bán ngay</label>
        </div>
        <label className="mt-4 block"><span className="mb-1 block text-sm text-gray-300">Mô tả</span><textarea rows={3} maxLength={500} value={form.description || ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value || null }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-red-500" /></label>
        <div className="mt-6 flex gap-3"><button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="flex-1 rounded-lg bg-gray-700 px-4 py-3 text-white">Hủy</button><button disabled={saving} className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu gói'}</button></div>
      </form>
    </div>}
    {toast && <div role="status" className="fixed right-5 top-20 z-[60] max-w-sm rounded-xl border border-gray-700 bg-gray-900 px-5 py-4 text-white shadow-2xl"><span>{toast}</span><button onClick={() => setToast('')} className="ml-4 text-gray-400">×</button></div>}
  </>
}
