import { NextFunction, Request, Response } from 'express'
import { ZodType } from 'zod'

type RequestTarget = 'body' | 'params' | 'query'

export const validate = (schema: ZodType, target: RequestTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
      return
    }

    Object.assign(req[target], result.data)
    next()
  }
