import { Request, Response } from 'express'
import * as uploadService from '../services/upload.service'
import { AppError } from '../errors/app-error'

const isAllowedImageContent = (buffer: Buffer) => {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const isWebp = buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  return isJpeg || isPng || isWebp
}

const isAllowedVideoContent = (buffer: Buffer) => {
  const isIsoMedia = buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp'
  const isEbml = buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  return isIsoMedia || isEbml
}

export const uploadVideo = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded', 'FILE_REQUIRED')
  if (!isAllowedVideoContent(req.file.buffer)) {
    throw new AppError(415, 'File content is not a supported video', 'INVALID_FILE_CONTENT')
  }
  res.json(await uploadService.uploadVideo(req.file.buffer))
}

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded', 'FILE_REQUIRED')
  if (!isAllowedImageContent(req.file.buffer)) {
    throw new AppError(415, 'File content is not a supported image', 'INVALID_FILE_CONTENT')
  }
  res.json(await uploadService.uploadImage(req.file.buffer))
}
