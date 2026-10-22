import { useState } from 'react'
import { MOOD_LABELS, MOODS } from '../domain/checkIn.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import styles from './CheckIn.module.css'
import MoodIcon from './MoodIcon.jsx'

// "How do you feel today?" on the Today screen (spec 003, US-1).
function CheckIn({ date, record }) {
  const { dispatch } = usePlan()
  const [editing, setEditing] = useState(false)

  function choose(mood) {
    dispatch({ type: 'SET_CHECK_IN', date, mood })
    setEditing(false)
  }

  if (record && !editing) {
    return (
      <section className={`${styles.card} ${styles.answered}`} aria-label="Today's check-in">
        <span className={styles.summaryIcon}>
          <MoodIcon mood={record.mood} />
        </span>
        <p className={styles.summary}>
          Feeling <strong>{MOOD_LABELS[record.mood].toLowerCase()}</strong> today
        </p>
        <button
          type="button"
          className={`${ui.button} ${ui.ghost} ${ui.small}`}
          onClick={() => setEditing(true)}
        >
          Change
        </button>
      </section>
    )
  }

  return (
    <section className={styles.card} aria-labelledby="check-in-title">
      <h2 id="check-in-title" className={styles.title}>
        How do you feel today?
      </h2>
      <div className={styles.options} role="group" aria-labelledby="check-in-title">
        {MOODS.map((mood) => (
          <button
            key={mood}
            type="button"
            className={`${styles.option} ${record?.mood === mood ? styles.selected : ''}`}
            aria-pressed={record?.mood === mood}
            onClick={() => choose(mood)}
          >
            <MoodIcon mood={mood} size={26} />
            {MOOD_LABELS[mood]}
          </button>
        ))}
      </div>
    </section>
  )
}

export default CheckIn
