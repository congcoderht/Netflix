import { Router } from 'express'
import * as genreController from '../controllers/genre.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import { genreIdParamsSchema, genreNameSchema } from '../validation/genre.validation'

export const genreRouter = Router()

genreRouter.get('/', asyncHandler(genreController.getAll))
genreRouter.post('/', authenticate, requireAdmin, validate(genreNameSchema), asyncHandler(genreController.create))
genreRouter.post('/find-or-create', authenticate, requireAdmin, validate(genreNameSchema), asyncHandler(genreController.findOrCreate))
genreRouter.patch('/:id', authenticate, requireAdmin, validate(genreIdParamsSchema, 'params'), validate(genreNameSchema), asyncHandler(genreController.update))
genreRouter.delete('/:id', authenticate, requireAdmin, validate(genreIdParamsSchema, 'params'), asyncHandler(genreController.remove))
