import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/billing.service'
import type { PaymentProvider } from '../services/mock-payment.gateway'

const userIdFrom = (req: Request) => (req.user as unknown as JwtPayload).userId

export const listPlans = async (_req: Request, res: Response) => res.json(await service.listPlans())
export const currentSubscription = async (req: Request, res: Response) => res.json(await service.getCurrentSubscription(userIdFrom(req)))
export const checkout = async (req: Request, res: Response) => res.status(201).json(await service.checkout(
  userIdFrom(req), req.body.planId, req.body.idempotencyKey, req.body.provider,
))
export const completeMockPayment = async (req: Request, res: Response) => res.json(await service.completeMockPayment(
  userIdFrom(req), req.params.provider as PaymentProvider, req.body.paymentId, req.body.checkoutToken, req.body.outcome,
))
export const listPayments = async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number }
  res.json(await service.listPayments(userIdFrom(req), page, limit))
}
export const getPayment = async (req: Request, res: Response) => res.json(await service.getPayment(userIdFrom(req), req.params.id as string))
export const getPaymentByOrder = async (req: Request, res: Response) => res.json(await service.getPaymentByOrder(userIdFrom(req), req.params.orderId as string))
