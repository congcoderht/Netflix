import { Router } from 'express'
import multer from 'multer'
import * as uploadController from '../controllers/upload.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'
import { AppError } from '../errors/app-error'

const storage = multer.memoryStorage()
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'])
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const videoUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (VIDEO_MIME_TYPES.has(file.mimetype)) cb(null, true)
    else cb(new AppError(415, 'Unsupported video type. Use MP4, WebM, MOV or MKV.', 'UNSUPPORTED_MEDIA_TYPE'))
  },
})

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) cb(null, true)
    else cb(new AppError(415, 'Unsupported image type. Use JPEG, PNG or WebP.', 'UNSUPPORTED_MEDIA_TYPE'))
  },
})

export const uploadRouter = Router()

uploadRouter.post('/video', authenticate, requireAdmin, videoUpload.single('file'), asyncHandler(uploadController.uploadVideo))
uploadRouter.post('/image', authenticate, requireAdmin, imageUpload.single('file'), asyncHandler(uploadController.uploadImage))
