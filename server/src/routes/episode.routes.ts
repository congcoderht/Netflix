import { Router } from 'express'
import * as episodeController from '../controllers/episode.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import {
  episodeCreateSchema,
  episodeParamsSchema,
  episodeUpdateSchema,
  movieParamsSchema,
  seasonCreateSchema,
  seasonParamsSchema,
  seasonUpdateSchema,
} from '../validation/episode.validation'

export const episodeRouter = Router({ mergeParams: true })

// Seasons — nested under /movies/:movieId/seasons
episodeRouter.get('/seasons', authenticate, validate(movieParamsSchema, 'params'), asyncHandler(episodeController.getSeasons))
episodeRouter.post('/seasons', authenticate, requireAdmin, validate(movieParamsSchema, 'params'), validate(seasonCreateSchema), asyncHandler(episodeController.createSeason))
episodeRouter.patch('/seasons/:seasonId', authenticate, requireAdmin, validate(seasonParamsSchema, 'params'), validate(seasonUpdateSchema), asyncHandler(episodeController.updateSeason))
episodeRouter.delete('/seasons/:seasonId', authenticate, requireAdmin, validate(seasonParamsSchema, 'params'), asyncHandler(episodeController.removeSeason))

// Episodes — nested under /movies/:movieId/seasons/:seasonId/episodes
episodeRouter.get('/seasons/:seasonId/episodes', authenticate, validate(seasonParamsSchema, 'params'), asyncHandler(episodeController.getEpisodes))
episodeRouter.post('/seasons/:seasonId/episodes', authenticate, requireAdmin, validate(seasonParamsSchema, 'params'), validate(episodeCreateSchema), asyncHandler(episodeController.createEpisode))
episodeRouter.patch('/seasons/:seasonId/episodes/:episodeId', authenticate, requireAdmin, validate(episodeParamsSchema, 'params'), validate(episodeUpdateSchema), asyncHandler(episodeController.updateEpisode))
episodeRouter.delete('/seasons/:seasonId/episodes/:episodeId', authenticate, requireAdmin, validate(episodeParamsSchema, 'params'), asyncHandler(episodeController.removeEpisode))
