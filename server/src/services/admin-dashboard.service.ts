import { ContentType, PaymentStatus, Role, SubscriptionStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

const VIETNAM_OFFSET_HOURS = 7
const DAY_MS = 86_400_000

const vietnamBoundaryUtc = (year: number, monthIndex: number, day = 1) =>
  new Date(Date.UTC(year, monthIndex, day, -VIETNAM_OFFSET_HOURS))

const effectivePaymentDate = (payment: { paidAt: Date | null; createdAt: Date }) => payment.paidAt ?? payment.createdAt
const vietnamParts = (date: Date) => {
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_HOURS * 3_600_000)
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() }
}

export const getDashboard = async (period: 'month' | 'year', year: number, selectedMonth?: number) => {
  const now = new Date()
  const currentVietnam = vietnamParts(now)
  const month = selectedMonth ?? currentVietnam.month
  const rangeStart = period === 'month' ? vietnamBoundaryUtc(year, month - 1) : vietnamBoundaryUtc(year, 0)
  const rangeEnd = period === 'month' ? vietnamBoundaryUtc(year, month) : vietnamBoundaryUtc(year + 1, 0)
  const userMonthStart = vietnamBoundaryUtc(currentVietnam.year, currentVietnam.month - 1)

  const [
    totalUsers, newUsersThisMonth, activeSubscriptions, movies, series,
    successfulPayments, failedPayments, recentPayments, periodPayments, popularMovieGroups,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({ where: { role: Role.USER, createdAt: { gte: userMonthStart } } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } } }),
    prisma.movie.count({ where: { type: ContentType.MOVIE } }),
    prisma.movie.count({ where: { type: ContentType.SERIES } }),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.findMany({
      where: { status: { in: [PaymentStatus.SUCCESS, PaymentStatus.FAILED] } },
      orderBy: { createdAt: 'desc' }, take: 8,
      select: {
        id: true, orderId: true, planName: true, provider: true, amount: true,
        currency: true, status: true, createdAt: true, paidAt: true,
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        OR: [
          { paidAt: { gte: rangeStart, lt: rangeEnd } },
          { paidAt: null, createdAt: { gte: rangeStart, lt: rangeEnd } },
        ],
      },
      select: { amount: true, paidAt: true, createdAt: true },
    }),
    prisma.watchHistory.groupBy({ by: ['movieId'], _count: { movieId: true }, orderBy: { _count: { movieId: 'desc' } }, take: 5 }),
  ])

  const revenueInPeriod = periodPayments.reduce((total, payment) => total + payment.amount, 0)
  const revenueSeries = period === 'month'
    ? Array.from({ length: Math.round((rangeEnd.getTime() - rangeStart.getTime()) / DAY_MS) }, (_, index) => {
        const day = index + 1
        return {
          key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          label: String(day).padStart(2, '0'),
          amount: periodPayments.filter((payment) => {
            const parts = vietnamParts(effectivePaymentDate(payment))
            return parts.year === year && parts.month === month && parts.day === day
          }).reduce((total, payment) => total + payment.amount, 0),
        }
      })
    : Array.from({ length: 12 }, (_, index) => ({
        key: `${year}-${String(index + 1).padStart(2, '0')}`,
        label: `T${index + 1}`,
        amount: periodPayments.filter((payment) => {
          const parts = vietnamParts(effectivePaymentDate(payment))
          return parts.year === year && parts.month === index + 1
        }).reduce((total, payment) => total + payment.amount, 0),
      }))

  const popularMovies = await prisma.movie.findMany({
    where: { id: { in: popularMovieGroups.map((item) => item.movieId) } },
    select: { id: true, title: true, thumbnail: true, type: true },
  })
  const movieById = new Map(popularMovies.map((movie) => [movie.id, movie]))
  const topMovies = popularMovieGroups.flatMap((item) => {
    const movie = movieById.get(item.movieId)
    return movie ? [{ ...movie, views: item._count.movieId }] : []
  })

  return {
    period: { type: period, year, month: period === 'month' ? month : null, timezone: 'Asia/Ho_Chi_Minh' },
    summary: {
      totalUsers, newUsersThisMonth, activeSubscriptions, revenueInPeriod,
      successfulPayments, failedPayments, movies, series,
    },
    revenueSeries,
    topMovies,
    recentPayments: recentPayments.map((payment) => ({
      ...payment,
      revenueAt: effectivePaymentDate(payment),
    })),
  }
}
