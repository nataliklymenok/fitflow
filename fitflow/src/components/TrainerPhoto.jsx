import { useState } from 'react'
import { videosById } from '../data/videos.js'
import styles from './TrainerPhoto.module.css'

// The thumbnail of one of the trainer's own videos, loaded from YouTube
// (spec 004, Checkpoint B). Falls back to initials if the image can't load.
function hue(id) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function coverAlt(trainer) {
  const video = videosById.get(trainer.cover)
  return video ? `${trainer.name}, from the video “${video.title}”` : trainer.name
}

// `described` gives the image alt text; leave it off where the name is
// already next to the picture, so it isn't read twice.
function TrainerPhoto({ trainer, width, described = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const size = width ? { width, fontSize: width * 0.22 } : undefined

  if (!trainer.cover || failed) {
    return (
      <span
        className={`${styles.frame} ${styles.initials} ${className}`}
        style={{ '--hue': hue(trainer.id), ...size }}
        role={described ? 'img' : undefined}
        aria-label={described ? trainer.name : undefined}
        aria-hidden={described ? undefined : 'true'}
      >
        {initials(trainer.name)}
      </span>
    )
  }

  return (
    <img
      className={`${styles.frame} ${className}`}
      style={size}
      src={`https://i.ytimg.com/vi/${trainer.cover}/hqdefault.jpg`}
      alt={described ? coverAlt(trainer) : ''}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export default TrainerPhoto
