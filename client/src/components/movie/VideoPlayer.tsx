import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface Props {
  url: string
  autoPlay?: boolean
}

export default function VideoPlayer({ url, autoPlay = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    // HLS stream
    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(video)
      return () => hls.destroy()
    }

    // Native HLS (Safari) hoặc mp4 thường
    video.src = url
  }, [url])

  return (
    <div className="relative w-full bg-black aspect-video rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay={autoPlay}
        playsInline
        controlsList="nodownload"
      />
    </div>
  )
}
