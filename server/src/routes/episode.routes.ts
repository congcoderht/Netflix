import { Router } from 'express'
import * as episodeController from '../controllers/episode.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

export const episodeRouter = Router({ mergeParams: true })

// Seasons — nested under /movies/:movieId/seasons
episodeRouter.get('/seasons', authenticate, episodeController.getSeasons)
episodeRouter.post('/seasons', authenticate, requireAdmin, episodeController.createSeason)
episodeRouter.patch('/seasons/:seasonId', authenticate, requireAdmin, episodeController.updateSeason)
episodeRouter.delete('/seasons/:seasonId', authenticate, requireAdmin, episodeController.removeSeason)

// Episodes — nested under /movies/:movieId/seasons/:seasonId/episodes
episodeRouter.get('/seasons/:seasonId/episodes', authenticate, episodeController.getEpisodes)
episodeRouter.post('/seasons/:seasonId/episodes', authenticate, requireAdmin, episodeController.createEpisode)
episodeRouter.patch('/seasons/:seasonId/episodes/:episodeId', authenticate, requireAdmin, episodeController.updateEpisode)
episodeRouter.delete('/seasons/:seasonId/episodes/:episodeId', authenticate, requireAdmin, episodeController.removeEpisode)
