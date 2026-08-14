import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface Props {
  url: string
  autoPlay?: boolean
  initialTime?: number
  onProgress?: (seconds: number) => void
}

export default function VideoPlayer({ url, autoPlay = false, initialTime = 0, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastReportedRef = useRef(0)
  const onProgressRef = useRef(onProgress)

  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])

  useEffect(() => () => {
    const seconds = Math.floor(videoRef.current?.currentTime ?? 0)
    if (seconds > 0) onProgressRef.current?.(seconds)
  }, [url])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    lastReportedRef.current = Math.floor(initialTime)
    const resume = () => {
      if (initialTime > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(initialTime, Math.max(0, video.duration - 1))
      }
    }
    video.addEventListener('loadedmetadata', resume)

    // HLS stream
    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(video)
      return () => {
        video.removeEventListener('loadedmetadata', resume)
        hls.destroy()
      }
    }

    // Native HLS (Safari) hoặc mp4 thường
    video.src = url
    return () => video.removeEventListener('loadedmetadata', resume)
  }, [url, initialTime])

  const reportProgress = (force = false) => {
    const seconds = Math.floor(videoRef.current?.currentTime ?? 0)
    if (seconds <= 0) return
    if (!force && seconds - lastReportedRef.current < 10) return
    lastReportedRef.current = seconds
    onProgressRef.current?.(seconds)
  }

  return (
    <div className="relative w-full bg-black aspect-video rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay={autoPlay}
        playsInline
        controlsList="nodownload"
        onTimeUpdate={() => reportProgress()}
        onPause={() => reportProgress(true)}
        onEnded={() => reportProgress(true)}
      />
    </div>
  )
}
