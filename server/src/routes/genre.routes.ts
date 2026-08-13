import { Router } from 'express'
import * as genreController from '../controllers/genre.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

export const genreRouter = Router()

genreRouter.get('/', genreController.getAll)
genreRouter.post('/', authenticate, requireAdmin, genreController.create)
genreRouter.post('/find-or-create', authenticate, requireAdmin, genreController.findOrCreate)
genreRouter.patch('/:id', authenticate, requireAdmin, genreController.update)
genreRouter.delete('/:id', authenticate, requireAdmin, genreController.remove)
