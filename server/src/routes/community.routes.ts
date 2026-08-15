import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate.middleware'
import {
  commentCreateSchema,
  commentListQuerySchema,
  commentParamsSchema,
  commentUpdateSchema,
  movieCommunityParamsSchema,
  ratingSchema,
} from '../validation/community.validation'
import * as controller from '../controllers/community.controller'

export const communityRouter = Router({ mergeParams: true })

communityRouter.use(authenticate)
communityRouter.get('/comments', validate(movieCommunityParamsSchema, 'params'), validate(commentListQuerySchema, 'query'), asyncHandler(controller.getComments))
communityRouter.post('/comments', validate(movieCommunityParamsSchema, 'params'), validate(commentCreateSchema), asyncHandler(controller.createComment))
communityRouter.patch('/comments/:commentId', validate(commentParamsSchema, 'params'), validate(commentUpdateSchema), asyncHandler(controller.updateComment))
communityRouter.delete('/comments/:commentId', validate(commentParamsSchema, 'params'), asyncHandler(controller.removeComment))
communityRouter.get('/rating', validate(movieCommunityParamsSchema, 'params'), asyncHandler(controller.getRating))
communityRouter.put('/rating', validate(movieCommunityParamsSchema, 'params'), validate(ratingSchema), asyncHandler(controller.setRating))
