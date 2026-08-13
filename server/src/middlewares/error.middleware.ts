import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'
import { AppError } from '../errors/app-error'
import multer from 'multer'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  void _next
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      details: err.details,
    })
    return
  }

  if (err instanceof multer.MulterError) {
    const isTooLarge = err.code === 'LIMIT_FILE_SIZE'
    res.status(isTooLarge ? 413 : 400).json({
      status: 'error',
      code: err.code,
      message: isTooLarge ? 'Uploaded file is too large' : err.message,
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapping: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: 'Resource already exists' },
      P2003: { status: 409, message: 'Resource is still in use' },
      P2025: { status: 404, message: 'Resource not found' },
    }
    const mapped = mapping[err.code]
    if (mapped) {
      res.status(mapped.status).json({ status: 'error', code: err.code, message: mapped.message })
      return
    }
  }

  console.error('❌ Error:', err.message);

  res.status(500).json({
    status: 'error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
};
