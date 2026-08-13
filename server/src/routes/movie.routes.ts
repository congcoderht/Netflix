import { Router } from 'express'
import * as movieController from '../controllers/movie.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

export const movieRouter = Router()

// Static actor routes must be declared before `/:id`, otherwise Express treats
// "actors" as a movie id.
movieRouter.get('/actors/search', authenticate, movieController.searchActors)
movieRouter.post('/actors', authenticate, requireAdmin, movieController.createActor)

// Public + User (danh sách chỉ trả published, admin thấy tất cả)
movieRouter.get('/', authenticate, movieController.getList)
movieRouter.get('/:id', authenticate, movieController.getById)

// Admin only
movieRouter.post('/', authenticate, requireAdmin, movieController.create)
movieRouter.patch('/:id', authenticate, requireAdmin, movieController.update)
movieRouter.delete('/:id', authenticate, requireAdmin, movieController.remove)
movieRouter.put('/:id/actors', authenticate, requireAdmin, movieController.setMovieActors)
