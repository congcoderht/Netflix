import { Request, Response } from 'express'
import * as episodeService from '../services/episode.service'

// ── Season ──────────────────────────────────────────────────────────────────

export const getSeasons = async (req: Request, res: Response) => {
  try {
    res.json(await episodeService.getSeasons(req.params.movieId as string))
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export const createSeason = async (req: Request, res: Response) => {
  try {
    const { number, title } = req.body
    if (!number) { res.status(400).json({ message: 'Season number is required' }); return }
    const season = await episodeService.createSeason(req.params.movieId as string, number, title)
    res.status(201).json(season)
  } catch (err: any) {
    if (err.code === 'P2002') { res.status(409).json({ message: 'Season number already exists' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateSeason = async (req: Request, res: Response) => {
  try {
    const season = await episodeService.updateSeason(req.params.seasonId as string, req.body)
    res.json(season)
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Season not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const removeSeason = async (req: Request, res: Response) => {
  try {
    await episodeService.removeSeason(req.params.seasonId as string)
    res.status(204).send()
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Season not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

// ── Episode ──────────────────────────────────────────────────────────────────

export const getEpisodes = async (req: Request, res: Response) => {
  try {
    res.json(await episodeService.getEpisodes(req.params.seasonId as string))
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export const createEpisode = async (req: Request, res: Response) => {
  try {
    const { number, title, videoUrl, duration, thumbnail } = req.body
    if (!number || !title) { res.status(400).json({ message: 'Episode number and title are required' }); return }
    const episode = await episodeService.createEpisode(req.params.seasonId as string, { number, title, videoUrl, duration, thumbnail })
    res.status(201).json(episode)
  } catch (err: any) {
    if (err.code === 'P2002') { res.status(409).json({ message: 'Episode number already exists' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateEpisode = async (req: Request, res: Response) => {
  try {
    const episode = await episodeService.updateEpisode(req.params.episodeId as string, req.body)
    res.json(episode)
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Episode not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}

export const removeEpisode = async (req: Request, res: Response) => {
  try {
    await episodeService.removeEpisode(req.params.episodeId as string)
    res.status(204).send()
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Episode not found' }); return }
    res.status(500).json({ message: 'Server error' })
  }
}
