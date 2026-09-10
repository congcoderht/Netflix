import crypto from 'crypto'
import { config } from '../config'
import { AppError } from '../errors/app-error'

export const paymentProviders = ['MOCK_MOMO', 'MOCK_VNPAY'] as const
export type PaymentProvider = typeof paymentProviders[number]
export type MockOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface VerifiedPaymentResult {
  provider: PaymentProvider
  orderId: string
  requestId: string
  amount: number
  transactionId: string
  outcome: MockOutcome
  failureCode?: string
  failureMessage?: string
}

interface CheckoutIdentity {
  provider: PaymentProvider
  paymentId: string
  orderId: string
  expiresAt: Date
}

const algorithmFor = (provider: PaymentProvider) => provider === 'MOCK_MOMO' ? 'sha256' : 'sha512'
const hmac = (provider: PaymentProvider, raw: string) => crypto
  .createHmac(algorithmFor(provider), config.payment.mockSecret)
  .update(raw)
  .digest('hex')

const signaturesMatch = (received: string, expected: string) => {
  const receivedBuffer = Buffer.from(received, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
}

const checkoutRaw = ({ provider, paymentId, orderId, expiresAt }: CheckoutIdentity) =>
  `${provider}|${paymentId}|${orderId}|${expiresAt.toISOString()}`

export const createMockCheckout = (identity: CheckoutIdentity) => {
  const token = hmac(identity.provider, checkoutRaw(identity))
  const url = new URL(`${config.payment.mockCheckoutUrl}/${identity.provider}`)
  url.searchParams.set('paymentId', identity.paymentId)
  url.searchParams.set('token', token)
  return { payUrl: url.toString() }
}

export const verifyCheckoutToken = (identity: CheckoutIdentity, token: string) => {
  if (!signaturesMatch(token, hmac(identity.provider, checkoutRaw(identity)))) {
    throw new AppError(400, 'Invalid checkout token', 'INVALID_CHECKOUT_TOKEN')
  }
}

const callbackRaw = (result: Omit<VerifiedPaymentResult, 'failureCode' | 'failureMessage'>) => {
  if (result.provider === 'MOCK_MOMO') {
    const resultCode = result.outcome === 'SUCCESS' ? '0' : result.outcome === 'CANCELLED' ? '1006' : '1001'
    return `amount=${result.amount}&orderId=${result.orderId}&provider=${result.provider}&requestId=${result.requestId}&resultCode=${resultCode}&transId=${result.transactionId}`
  }

  const responseCode = result.outcome === 'SUCCESS' ? '00' : result.outcome === 'CANCELLED' ? '24' : '99'
  return `vnp_Amount=${result.amount * 100}&vnp_ResponseCode=${responseCode}&vnp_TmnCode=MOCK&vnp_TransactionNo=${result.transactionId}&vnp_TxnRef=${result.orderId}`
}

// Simulates the provider creating an IPN, then verifies it through the same adapter boundary.
const verifyMockIpn = (
  result: Omit<VerifiedPaymentResult, 'failureCode' | 'failureMessage'>,
  signature: string,
) => {
  const expected = hmac(result.provider, callbackRaw(result))
  if (!signaturesMatch(signature, expected)) {
    throw new AppError(400, 'Invalid payment signature', 'INVALID_PAYMENT_SIGNATURE')
  }
  return result
}

export const createAndVerifyMockIpn = (
  provider: PaymentProvider,
  input: { orderId: string; requestId: string; amount: number; outcome: MockOutcome },
): VerifiedPaymentResult => {
  const unsigned = {
    provider,
    ...input,
    transactionId: `${provider}_${crypto.randomUUID().replace(/-/g, '')}`,
  }
  const signedIpn = { payload: unsigned, signature: hmac(provider, callbackRaw(unsigned)) }
  const verified = verifyMockIpn(signedIpn.payload, signedIpn.signature)

  if (input.outcome === 'SUCCESS') return verified
  return {
    ...verified,
    failureCode: input.outcome === 'CANCELLED' ? 'USER_CANCELLED' : 'PAYMENT_DECLINED',
    failureMessage: input.outcome === 'CANCELLED' ? 'Payment cancelled by user' : 'Mock payment was declined',
  }
}

export const assertMockPaymentEnabled = () => {
  if (config.payment.mode !== 'mock' || config.nodeEnv === 'production') {
    throw new AppError(404, 'Mock payment is not available', 'MOCK_PAYMENT_DISABLED')
  }
}
