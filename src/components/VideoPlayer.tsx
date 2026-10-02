import { useEffect, useRef, useState } from 'react'
import { isMediaVisible, isPlaybackFailure, shouldAutoplay } from '@/lib/media-policy'

// The player is content-free: the caller supplies what it plays, so every source
// comes from content/site.yaml rather than a default buried in a component.
type VideoPlayerProps = {
  autoplay?: boolean
  label?: string
  src: string
  poster: string
  caption?: string
  demo?: boolean
}

export function VideoPlayer({
  autoplay = false,
  label = 'Preview video',
  src,
  poster,
  caption,
  demo = false,
}: VideoPlayerProps) {
  const video = useRef<HTMLVideoElement>(null)
  const manualPause = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [failed, setFailed] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    let inView = false
    let disposed = false
    const pauseOthers = () => {
      document.querySelectorAll('video').forEach((other) => {
        if (other !== element) other.pause()
      })
    }
    const maybePlay = () => {
      if (shouldAutoplay({ autoplay, inView, hidden: document.hidden, reducedMotion: reduced.matches,
        saveData: Boolean(connection?.saveData), manualPause: manualPause.current, muted: element.muted, failed })) {
        element.play().catch(() => { if (!disposed) setPlaying(false) })
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = isMediaVisible(entry.isIntersecting, entry.intersectionRatio)
      if (inView) maybePlay()
      else element.pause()
    }, { threshold: [0, 0.3] })
    const visibility = () => { if (document.hidden) element.pause(); else maybePlay() }
    const motion = () => { if (reduced.matches) element.pause(); else maybePlay() }
    element.addEventListener('play', pauseOthers)
    document.addEventListener('visibilitychange', visibility)
    reduced.addEventListener('change', motion)
    observer.observe(element)
    return () => {
      disposed = true
      observer.disconnect()
      element.pause()
      element.removeEventListener('play', pauseOthers)
      document.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', motion)
    }
  }, [autoplay, failed, src])

  const play = () => {
    if (!video.current) return
    manualPause.current = false
    video.current.play().catch((error: DOMException) => {
      // Browser autoplay/permission rejection is not a broken media file.
      if (isPlaybackFailure(error)) setFailed(true)
    })
  }

  const togglePlayback = () => {
    if (playing) {
      manualPause.current = true
      video.current?.pause()
    } else play()
  }

  const toggleSound = () => {
    if (!video.current) return
    const nextMuted = !muted
    video.current.muted = nextMuted
    setMuted(nextMuted)
    if (!nextMuted) play()
  }

  return (
    <div className="video-player">
      <div className="video-stage">
        <video ref={video} aria-label={label} src={src} poster={poster} muted={muted} playsInline loop={demo} preload="none"
          onPlay={() => { setPlaying(true); setHasPlayed(true) }} onPause={() => { setPlaying(false); setBuffering(false) }}
          onWaiting={() => setBuffering(true)} onPlaying={() => setBuffering(false)} onError={() => setFailed(true)} />
        {!hasPlayed && !failed && <div className="video-overlay"><button data-magnetic data-cursor="Play" className="play-button" onClick={play} aria-label={`Play ${label}`}><span aria-hidden="true">▶</span></button></div>}
        {failed && <div className="video-error" role="status"><p>Video unavailable.</p><button className="button" onClick={() => {
          setFailed(false)
          setBuffering(false)
          video.current?.load()
          play()
        }}>Retry</button></div>}
      </div>
      <div className="video-controls">
        <button data-magnetic data-cursor={playing ? 'Pause' : 'Play'} className="text-link" onClick={togglePlayback} disabled={failed}>{playing ? 'Pause' : 'Play'} <span aria-hidden="true">{playing ? 'Ⅱ' : '↗'}</span></button>
        <span className="video-state" role="status">{buffering && playing ? 'Buffering' : playing ? 'Playing' : 'Paused'}</span>
        <button data-magnetic data-cursor={muted ? 'Sound on' : 'Mute'} className="text-link" disabled={failed} onClick={toggleSound}>{muted ? 'Play sound' : 'Mute'} <span aria-hidden="true">{muted ? '+' : '−'}</span></button>
      </div>
      {caption && <p className="media-note">{caption}</p>}
    </div>
  )
}
