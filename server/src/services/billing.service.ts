import crypto from 'crypto'
import { PaymentStatus, SubscriptionStatus } from '@prisma/client'
import { config } from '../config'
import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'
import {
  assertMockPaymentEnabled,
  createAndVerifyMockIpn,
  createMockCheckout,
  verifyCheckoutToken,
  type MockOutcome,
  type PaymentProvider,
  type VerifiedPaymentResult,
} from './mock-payment.gateway'

export const listPlans = () => prisma.plan.findMany({
  where: { isActive: true },
  orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
})

export const getCurrentSubscription = async (userId: string) => {
  const now = new Date()
  await prisma.subscription.updateMany({
    where: { userId, status: SubscriptionStatus.ACTIVE, expiresAt: { lte: now } },
    data: { status: SubscriptionStatus.EXPIRED },
  })
  return prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true },
  })
}

export const checkout = async (
  userId: string,
  planId: string,
  idempotencyKey: string,
  provider: PaymentProvider,
) => {
  assertMockPaymentEnabled()
  const existing = await prisma.payment.findUnique({ where: { requestId: idempotencyKey } })
  if (existing) {
    if (existing.userId !== userId || existing.planId !== planId || existing.provider !== provider) {
      throw new AppError(409, 'Idempotency key already used with different data', 'IDEMPOTENCY_CONFLICT')
    }
    if (existing.paymentUrl && existing.status === PaymentStatus.PENDING) {
      return { paymentId: existing.id, payUrl: existing.paymentUrl }
    }
    throw new AppError(409, 'Payment request was already processed', 'PAYMENT_ALREADY_PROCESSED')
  }

  const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true } })
  if (!plan) throw new AppError(404, 'Plan not found', 'PLAN_NOT_FOUND')

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  const payment = await prisma.payment.create({
    data: {
      userId,
      planId: plan.id,
      orderId: `NFLX_${crypto.randomUUID().replace(/-/g, '')}`,
      requestId: idempotencyKey,
      provider,
      amount: plan.price,
      currency: plan.currency,
      planName: plan.name,
      durationDays: plan.durationDays,
      expiresAt,
    },
  })
  const { payUrl } = createMockCheckout({
    provider,
    paymentId: payment.id,
    orderId: payment.orderId,
    expiresAt,
  })
  await prisma.payment.update({ where: { id: payment.id }, data: { paymentUrl: payUrl } })
  return { paymentId: payment.id, payUrl }
}

const applyPaymentResult = async (result: VerifiedPaymentResult) => {
  const payment = await prisma.payment.findUnique({ where: { orderId: result.orderId } })
  if (!payment || payment.requestId !== result.requestId) {
    throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND')
  }
  if (payment.provider !== result.provider) throw new AppError(400, 'Payment provider mismatch', 'PAYMENT_PROVIDER_MISMATCH')
  if (payment.amount !== result.amount) throw new AppError(400, 'Payment amount mismatch', 'PAYMENT_AMOUNT_MISMATCH')
  if (payment.status === PaymentStatus.SUCCESS) return payment

  if (payment.expiresAt <= new Date()) {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.EXPIRED, failureMessage: 'Payment session expired' },
    })
    throw new AppError(409, 'Payment session expired', 'PAYMENT_EXPIRED')
  }

  if (result.outcome !== 'SUCCESS') {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.FAILED,
        failureCode: result.failureCode,
        failureMessage: result.failureMessage,
      },
    })
    return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        providerTransactionId: result.transactionId,
        failureCode: null,
        failureMessage: null,
      },
    })
    if (claimed.count === 0) return

    const now = new Date()
    const current = await tx.subscription.findFirst({
      where: { userId: payment.userId, status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' },
    })
    const renewsCurrentPlan = current?.planId === payment.planId
    const base = renewsCurrentPlan && current.expiresAt > now ? current.expiresAt : now
    const expiresAt = new Date(base.getTime() + payment.durationDays * 86_400_000)
    const subscription = current
      ? await tx.subscription.update({
          where: { id: current.id },
          data: {
            planId: payment.planId,
            startedAt: renewsCurrentPlan ? undefined : now,
            expiresAt,
          },
        })
      : await tx.subscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            status: SubscriptionStatus.ACTIVE,
            startedAt: now,
            expiresAt,
          },
        })
    await tx.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } })
  })

  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
}

export const completeMockPayment = async (
  userId: string,
  provider: PaymentProvider,
  paymentId: string,
  checkoutToken: string,
  outcome: MockOutcome,
) => {
  assertMockPaymentEnabled()
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId } })
  if (!payment) throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND')
  if (payment.provider !== provider) throw new AppError(400, 'Payment provider mismatch', 'PAYMENT_PROVIDER_MISMATCH')

  verifyCheckoutToken({ provider, paymentId, orderId: payment.orderId, expiresAt: payment.expiresAt }, checkoutToken)

  if (payment.status !== PaymentStatus.PENDING) {
    return { payment, redirectUrl: `${config.payment.resultUrl}?orderId=${encodeURIComponent(payment.orderId)}` }
  }

  const verifiedIpn = createAndVerifyMockIpn(provider, {
    orderId: payment.orderId,
    requestId: payment.requestId,
    amount: payment.amount,
    outcome,
  })
  const updated = await applyPaymentResult(verifiedIpn)
  return { payment: updated, redirectUrl: `${config.payment.resultUrl}?orderId=${encodeURIComponent(payment.orderId)}` }
}

export const listPayments = async (userId: string, page: number, limit: number) => {
  const where = { userId, status: { in: [PaymentStatus.SUCCESS, PaymentStatus.FAILED] } }
  const [items, total] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.payment.count({ where }),
  ])
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const getPayment = async (userId: string, id: string) => {
  const payment = await prisma.payment.findFirst({ where: { id, userId } })
  if (!payment) throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND')
  return payment
}

export const getPaymentByOrder = async (userId: string, orderId: string) => {
  const payment = await prisma.payment.findFirst({ where: { orderId, userId } })
  if (!payment) throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND')
  return payment
}
