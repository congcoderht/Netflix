import { Request, Response } from 'express'
import * as service from '../services/admin-plan.service'

export const list = async (_req: Request, res: Response) => res.json(await service.listPlans())
export const create = async (req: Request, res: Response) => res.status(201).json(await service.createPlan(req.body))
export const update = async (req: Request, res: Response) => res.json(await service.updatePlan(req.params.id as string, req.body))
