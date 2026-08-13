import { Router } from 'express'
import * as movieController from '../controllers/movie.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import {
  actorCreateSchema,
  actorSearchQuerySchema,
  idParamsSchema,
  movieActorsSchema,
  movieCreateSchema,
  movieListQuerySchema,
  movieUpdateSchema,
} from '../validation/movie.validation'

export const movieRouter = Router()

// Static actor routes must be declared before `/:id`, otherwise Express treats
// "actors" as a movie id.
movieRouter.get('/actors/search', authenticate, validate(actorSearchQuerySchema, 'query'), asyncHandler(movieController.searchActors))
movieRouter.post('/actors', authenticate, requireAdmin, validate(actorCreateSchema), asyncHandler(movieController.createActor))

// Public + User (danh sách chỉ trả published, admin thấy tất cả)
movieRouter.get('/', authenticate, validate(movieListQuerySchema, 'query'), asyncHandler(movieController.getList))
movieRouter.get('/:id', authenticate, validate(idParamsSchema, 'params'), asyncHandler(movieController.getById))

// Admin only
movieRouter.post('/', authenticate, requireAdmin, validate(movieCreateSchema), asyncHandler(movieController.create))
movieRouter.patch('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(movieUpdateSchema), asyncHandler(movieController.update))
movieRouter.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), asyncHandler(movieController.remove))
movieRouter.put('/:id/actors', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(movieActorsSchema), asyncHandler(movieController.setMovieActors))
