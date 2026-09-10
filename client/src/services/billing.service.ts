import { api } from '@/lib/axios'

export interface Plan {
  id: string
  code: string
  name: string
  price: number
  currency: string
  durationDays: number
  description: string | null
  maxScreens: number
}

export interface Subscription {
  id: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  startedAt: string
  expiresAt: string
  plan: Plan
}

export interface Payment {
  id: string
  orderId: string
  provider: PaymentProvider | 'MOMO'
  planName: string
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  failureMessage: string | null
  paidAt: string | null
  createdAt: string
}

export type PaymentProvider = 'MOCK_MOMO' | 'MOCK_VNPAY'
export type MockPaymentOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED'

export const getPlans = async () => (await api.get<Plan[]>('/plans')).data
export const getCurrentSubscription = async () => (await api.get<Subscription | null>('/subscriptions/me')).data
export const getPayments = async () => (await api.get<{ items: Payment[] }>('/payments')).data.items
export const getPaymentByOrder = async (orderId: string) => (await api.get<Payment>(`/payments/order/${orderId}`)).data
export const getPayment = async (paymentId: string) => (await api.get<Payment>(`/payments/${paymentId}`)).data
export const checkout = async (planId: string, provider: PaymentProvider) => (await api.post<{ paymentId: string; payUrl: string }>('/payments/checkout', {
  planId,
  provider,
  idempotencyKey: crypto.randomUUID(),
})).data
export const completeMockPayment = async (
  provider: PaymentProvider,
  paymentId: string,
  checkoutToken: string,
  outcome: MockPaymentOutcome,
) => (await api.post<{ payment: Payment; redirectUrl: string }>(`/payments/mock/${provider}/complete`, {
  paymentId,
  checkoutToken,
  outcome,
})).data
