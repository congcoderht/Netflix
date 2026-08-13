import { Router } from 'express'
import multer from 'multer'
import * as uploadController from '../controllers/upload.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

const storage = multer.memoryStorage()

const videoUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true)
    else cb(new Error('Only video files are allowed'))
  },
})

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

export const uploadRouter = Router()

uploadRouter.post('/video', authenticate, requireAdmin, videoUpload.single('file'), uploadController.uploadVideo)
uploadRouter.post('/image', authenticate, requireAdmin, imageUpload.single('file'), uploadController.uploadImage)
