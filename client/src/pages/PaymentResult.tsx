import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { getPaymentByOrder, type Payment } from '@/services/billing.service'

export default function PaymentResult() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [error, setError] = useState('')
  const queryError = orderId ? '' : 'Thiếu mã giao dịch'

  useEffect(() => {
    if (!orderId) return
    getPaymentByOrder(orderId)
      .then(setPayment)
      .catch(() => setError('Không tìm thấy giao dịch'))
  }, [orderId])

  const title = payment?.status === 'SUCCESS'
    ? 'Thanh toán thành công'
    : payment?.status === 'PENDING'
      ? 'Đang xác nhận thanh toán'
      : 'Thanh toán chưa thành công'

  return <Layout><main className="flex min-h-screen items-center justify-center px-4 pt-16">
    <div className="w-full max-w-lg rounded-2xl bg-gray-900 p-8 text-center">
      <h1 className="text-2xl font-bold text-white">{queryError || error || title}</h1>
      {payment && <p className="mt-3 text-gray-400">Giao dịch {payment.orderId}<br />Trạng thái: {payment.status}</p>}
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/billing" className="rounded bg-red-600 px-5 py-3 font-bold text-white">Quản lý gói</Link>
        <Link to="/" className="rounded bg-gray-700 px-5 py-3 text-white">Trang chủ</Link>
      </div>
    </div>
  </main></Layout>
}
