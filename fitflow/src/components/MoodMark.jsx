import { MOOD_LABELS } from '../domain/checkIn.js'
import MoodIcon from './MoodIcon.jsx'
import styles from './MoodMark.module.css'

// How the user felt on a day, shown in the calendar (spec 003, US-5).
function MoodMark({ mood }) {
  if (!mood) return null
  return (
    <span className={styles.mark} role="img" aria-label={`Felt ${MOOD_LABELS[mood].toLowerCase()}`}>
      <MoodIcon mood={mood} size={16} />
    </span>
  )
}

export default MoodMark
