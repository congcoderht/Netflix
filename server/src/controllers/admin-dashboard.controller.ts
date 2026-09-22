import { Request, Response } from 'express'
import { getDashboard } from '../services/admin-dashboard.service'

export const dashboard = async (req: Request, res: Response) => {
  const { period, year, month } = req.query as unknown as { period: 'month' | 'year'; year: number; month?: number }
  res.json(await getDashboard(period, year, month))
}
