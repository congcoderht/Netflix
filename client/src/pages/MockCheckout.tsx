import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '@/lib/api-error'
import { completeMockPayment, getPayment, type Payment, type PaymentProvider } from '@/services/billing.service'

const providers: PaymentProvider[] = ['MOCK_MOMO', 'MOCK_VNPAY']
const money = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

function PaymentQr({ value, color }: { value: string; color: string }) {
  const cells = useMemo(() => {
    const size = 29
    const seed = [...value].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 2166136261)
    const finder = (x: number, y: number, startX: number, startY: number) => {
      const dx = x - startX
      const dy = y - startY
      return dx >= 0 && dx < 7 && dy >= 0 && dy < 7
        && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
    }
    return Array.from({ length: size * size }, (_, index) => {
      const x = index % size
      const y = Math.floor(index / size)
      const fixed = finder(x, y, 1, 1) || finder(x, y, 21, 1) || finder(x, y, 1, 21)
      const mixed = Math.imul(seed ^ Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663), 2654435761)
      return fixed || ((mixed >>> 0) % 3 === 0)
    })
  }, [value])

  return <svg viewBox="0 0 31 31" className="h-56 w-56 rounded-xl bg-white p-3" aria-label="Mã QR thanh toán">
    {cells.map((active, index) => active && <rect key={index} x={(index % 29) + 1} y={Math.floor(index / 29) + 1} width="1" height="1" fill={color} />)}
  </svg>
}

export default function MockCheckout() {
  const { provider: rawProvider } = useParams()
  const [params] = useSearchParams()
  const provider = providers.find((item) => item === rawProvider)
  const paymentId = params.get('paymentId')
  const checkoutToken = params.get('token')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const linkError = !provider || !paymentId || !checkoutToken ? 'Liên kết thanh toán không hợp lệ' : ''

  useEffect(() => {
    if (!provider || !paymentId || !checkoutToken) return
    getPayment(paymentId).then(setPayment).catch((err) => setError(getApiErrorMessage(err, 'Không tìm thấy giao dịch')))
  }, [checkoutToken, paymentId, provider])

  const confirmPayment = async () => {
    if (!provider || !paymentId || !checkoutToken) return
    setSubmitting(true)
    setError('')
    try {
      const result = await completeMockPayment(provider, paymentId, checkoutToken, 'SUCCESS')
      window.location.assign(result.redirectUrl)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xác nhận thanh toán'))
      setSubmitting(false)
    }
  }

  const isMomo = provider === 'MOCK_MOMO'
  const providerName = isMomo ? 'MoMo' : 'VNPAY'
  const brandColor = isMomo ? '#a50064' : '#1268b3'
  return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
        <img src={isMomo ? '/payments/momo.svg' : '/payments/vnpay.svg'} alt={providerName} className="h-12 w-auto" />
        <div className="text-right"><p className="text-sm text-slate-500">Cổng thanh toán</p><p className="font-semibold">An toàn & bảo mật</p></div>
      </header>

      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-2xl font-bold">Thanh toán đơn hàng</h1>
          {payment && <dl className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 px-5">
            <div className="flex justify-between gap-4 py-4"><dt className="text-slate-500">Đơn hàng</dt><dd className="max-w-52 break-all text-right text-sm font-medium">{payment.orderId}</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt className="text-slate-500">Nội dung</dt><dd className="font-medium">Gói Netflix {payment.planName}</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt className="text-slate-500">Số tiền</dt><dd className="text-xl font-bold" style={{ color: brandColor }}>{money(payment.amount)}</dd></div>
          </dl>}
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Mở ứng dụng {providerName}, chọn quét mã QR và kiểm tra đúng số tiền trước khi thanh toán.
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-4 font-semibold">Quét mã để thanh toán</p>
          <PaymentQr value={payment?.orderId || paymentId || 'NETFLIX'} color={brandColor} />
          <p className="mt-3 text-center text-xs text-slate-500">Mã QR hết hạn sau 30 phút</p>
        </div>
      </div>

      {(linkError || error) && <p className="mx-6 mb-5 rounded-lg bg-red-50 p-3 text-center text-red-700 sm:mx-8">{linkError || error}</p>}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
        {payment?.status === 'PENDING' ? <button
          disabled={submitting}
          onClick={() => void confirmPayment()}
          className="w-full rounded-lg px-5 py-3.5 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          style={{ backgroundColor: brandColor }}
        >{submitting ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}</button> : payment && <Link to={`/payment/result?orderId=${encodeURIComponent(payment.orderId)}`} className="block w-full rounded-lg bg-slate-800 px-5 py-3.5 text-center font-bold text-white">Xem kết quả giao dịch</Link>}
        <Link to="/billing" className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-900">Hủy và quay lại</Link>
      </footer>
    </section>
  </main>
}
