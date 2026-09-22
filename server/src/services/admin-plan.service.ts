import { AppError } from '../errors/app-error'
import { prisma } from '../lib/prisma'

export interface PlanInput {
  code: string
  name: string
  price: number
  currency: string
  durationDays: number
  description: string | null
  maxScreens: number
  sortOrder: number
  isActive: boolean
}

const planInclude = { _count: { select: { subscriptions: true, payments: true } } }

export const listPlans = () => prisma.plan.findMany({
  orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
  include: planInclude,
})

export const createPlan = (data: PlanInput) => prisma.plan.create({ data, include: planInclude })

export const updatePlan = async (id: string, data: Partial<PlanInput>) => {
  const plan = await prisma.plan.findUnique({ where: { id }, select: { id: true } })
  if (!plan) throw new AppError(404, 'Plan not found', 'PLAN_NOT_FOUND')
  return prisma.plan.update({ where: { id }, data, include: planInclude })
}
