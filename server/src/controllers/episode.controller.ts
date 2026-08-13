import { Request, Response } from 'express'
import * as episodeService from '../services/episode.service'

// ── Season ──────────────────────────────────────────────────────────────────

export const getSeasons = async (req: Request, res: Response) => {
  res.json(await episodeService.getSeasons(req.params.movieId as string))
}

export const createSeason = async (req: Request, res: Response) => {
  const { number, title } = req.body
  const season = await episodeService.createSeason(req.params.movieId as string, number, title)
  res.status(201).json(season)
}

export const updateSeason = async (req: Request, res: Response) => {
  const season = await episodeService.updateSeason(
    req.params.movieId as string,
    req.params.seasonId as string,
    req.body,
  )
  res.json(season)
}

export const removeSeason = async (req: Request, res: Response) => {
  await episodeService.removeSeason(req.params.movieId as string, req.params.seasonId as string)
  res.status(204).send()
}

// ── Episode ─────────────────────────────────────────────────────────────────

export const getEpisodes = async (req: Request, res: Response) => {
  res.json(await episodeService.getEpisodes(
    req.params.movieId as string,
    req.params.seasonId as string,
  ))
}

export const createEpisode = async (req: Request, res: Response) => {
  const { number, title, videoUrl, duration, thumbnail } = req.body
  const episode = await episodeService.createEpisode(
    req.params.movieId as string,
    req.params.seasonId as string,
    { number, title, videoUrl, duration, thumbnail },
  )
  res.status(201).json(episode)
}

export const updateEpisode = async (req: Request, res: Response) => {
  const episode = await episodeService.updateEpisode(
    req.params.movieId as string,
    req.params.seasonId as string,
    req.params.episodeId as string,
    req.body,
  )
  res.json(episode)
}

export const removeEpisode = async (req: Request, res: Response) => {
  await episodeService.removeEpisode(
    req.params.movieId as string,
    req.params.seasonId as string,
    req.params.episodeId as string,
  )
  res.status(204).send()
}
