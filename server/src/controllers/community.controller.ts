import { Request, Response } from 'express'
import { JwtPayload } from '../utils/jwt.util'
import * as service from '../services/community.service'

const currentUser = (req: Request) => req.user as unknown as JwtPayload

export const getComments = async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number }
  res.json(await service.getComments(req.params.movieId as string, page, limit))
}

export const createComment = async (req: Request, res: Response) => {
  const { content, parentId } = req.body as { content: string; parentId?: string | null }
  res.status(201).json(await service.createComment(
    currentUser(req).userId,
    req.params.movieId as string,
    content,
    parentId,
  ))
}

export const updateComment = async (req: Request, res: Response) => {
  res.json(await service.updateComment(
    currentUser(req).userId,
    req.params.movieId as string,
    req.params.commentId as string,
    req.body.content as string,
  ))
}

export const removeComment = async (req: Request, res: Response) => {
  const user = currentUser(req)
  await service.removeComment(
    user.userId,
    user.role,
    req.params.movieId as string,
    req.params.commentId as string,
  )
  res.status(204).send()
}

export const getRating = async (req: Request, res: Response) => {
  res.json(await service.getRating(currentUser(req).userId, req.params.movieId as string))
}

export const setRating = async (req: Request, res: Response) => {
  res.json(await service.setRating(
    currentUser(req).userId,
    req.params.movieId as string,
    req.body.score as number,
  ))
}
