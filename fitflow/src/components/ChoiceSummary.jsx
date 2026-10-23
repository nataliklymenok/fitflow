import { trainersById } from '../data/trainers.js'
import { CATEGORIES, CATEGORY_LABELS } from '../domain/catalog.js'
import { MAX_TRAINERS } from '../domain/preferences.js'
import { categoryVars } from '../lib/categoryVars.js'
import ui from '../styles/ui.module.css'
import styles from './ChoiceSummary.module.css'

// Who and what the plan uses: chosen trainers, Clear, and type toggles.
// Shared by the Trainers page and the quiz (spec 004, US-2, US-6).
function ChoiceSummary({ draft, extraMessage, showClear = true }) {
  const { value, notice, errors, toggleCategory, clearTrainers } = draft
  const count = value.trainers.length
  const message = notice || errors[0] || extraMessage

  return (
    <div className={styles.summary}>
      <div className={styles.row}>
        <p className={styles.who}>
          {count === 0 ? (
            <strong>Any trainer</strong>
          ) : (
            <>
              <strong>
                {count} of {MAX_TRAINERS} selected:
              </strong>{' '}
              {value.trainers.map((id) => trainersById.get(id)?.name).join(', ')}
            </>
          )}
        </p>
        {showClear && count > 0 && (
          <button type="button" className={`${ui.button} ${ui.ghost} ${ui.small}`} onClick={clearTrainers}>
            Clear
          </button>
        )}
      </div>
      <div className={styles.types} role="group" aria-label="Workout types in my plan">
        {CATEGORIES.map((category) => {
          const on = value.categories.includes(category)
          return (
            <button
              key={category}
              type="button"
              className={`${styles.type} ${on ? styles.on : ''}`}
              style={categoryVars(category)}
              aria-pressed={on}
              onClick={() => toggleCategory(category)}
            >
              {on ? '✓ ' : ''}
              {CATEGORY_LABELS[category]}
            </button>
          )
        })}
      </div>
      <p className={styles.message} role="status">
        {message}
      </p>
    </div>
  )
}

export default ChoiceSummary
