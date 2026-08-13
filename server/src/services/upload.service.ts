import { cloudinary } from '../lib/cloudinary'
import { Readable } from 'stream'

const streamUpload = (buffer: Buffer, options: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
    Readable.from(buffer).pipe(uploadStream)
  })
}

export const uploadVideo = async (buffer: Buffer, folder = 'netflix/videos') => {
  const result = await streamUpload(buffer, {
    folder,
    resource_type: 'video',
    chunk_size: 6_000_000,        // 6MB chunks
    eager: [
      { format: 'mp4', quality: 'auto' },
    ],
    eager_async: true,
  })
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: Math.round(result.duration || 0),
    format: result.format,
  }
}

export const uploadImage = async (buffer: Buffer, folder = 'netflix/thumbnails') => {
  const result = await streamUpload(buffer, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
  })
  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

export const deleteFile = async (publicId: string, resourceType: 'video' | 'image' = 'image') => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
