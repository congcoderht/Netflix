import { Request, Response } from 'express'
import * as uploadService from '../services/upload.service'

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No file uploaded' }); return }
    const result = await uploadService.uploadVideo(req.file.buffer)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No file uploaded' }); return }
    const result = await uploadService.uploadImage(req.file.buffer)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
}
