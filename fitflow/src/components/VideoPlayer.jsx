import { useEffect, useRef, useState } from 'react'
import {
  PLAYER_ENDED,
  UNAVAILABLE_ERRORS,
  loadYouTubeApi,
} from '../lib/youtubeApi.js'
import ui from '../styles/ui.module.css'
import styles from './VideoPlayer.module.css'

const MESSAGES = {
  unavailable: 'This video is unavailable. It may have been removed, or its owner does not allow playing it here.',
  failed: "This video can't be played right now.",
  offline: "The YouTube player couldn't load. Check your connection and try again.",
}

// Embedded YouTube player (US-4). Remount with a new `key` to change videos.
function VideoPlayer({ videoId, title, onEnded, onSwap }) {
  const containerRef = useRef(null)
  const onEndedRef = useRef(onEnded)
  const [error, setError] = useState(null)

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    let player = null
    let cancelled = false
    const container = containerRef.current
    // YT.Player replaces its target element, so give it one React doesn't own.
    const target = document.createElement('div')
    container.append(target)

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return
        player = new YT.Player(target, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          playerVars: { rel: 0, playsinline: 1 },
          events: {
            onReady: (event) => {
              event.target.getIframe().title = `YouTube video: ${title}`
            },
            onError: (event) => {
              setError(
                UNAVAILABLE_ERRORS.includes(event.data) ? 'unavailable' : 'failed',
              )
            },
            onStateChange: (event) => {
              if (event.data === PLAYER_ENDED) onEndedRef.current?.()
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) setError('offline')
      })

    return () => {
      cancelled = true
      player?.destroy()
      container.replaceChildren()
    }
  }, [videoId, title])

  return (
    <div className={styles.frame}>
      <div ref={containerRef} className={styles.player} />
      {error && (
        <div className={styles.error} role="alert">
          <p>{MESSAGES[error]}</p>
          {onSwap && error !== 'offline' && (
            <button
              type="button"
              className={`${ui.button} ${ui.primary}`}
              onClick={onSwap}
            >
              Swap video
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
