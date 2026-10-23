import { useState } from 'react'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { formatDay } from '../domain/dates.js'
import { addSession } from '../domain/planReducer.js'
import { newSeed } from '../domain/random.js'
import { usePlan } from '../state/planContext.js'
import { useAllowedVideos } from '../state/useAllowedVideos.js'
import ui from '../styles/ui.module.css'
import Dialog from './Dialog.jsx'
import styles from './SessionEditor.module.css'

// Adds a session to a rest day (US-5). `date` is null while closed.
function AddSessionDialog({ date, onClose }) {
  const { state, dispatch } = usePlan()
  const { videos, categories } = useAllowedVideos()
  const [category, setCategory] = useState(categories[0])

  function add(event) {
    event.preventDefault()
    dispatch(addSession(state, videos, { date, category, seed: newSeed() }))
    onClose()
  }

  return (
    <Dialog
      open={date !== null}
      onClose={onClose}
      title={date ? `Add a session on ${formatDay(date, 'EEE, MMM d')}` : 'Add a session'}
    >
      <form className={styles.section} onSubmit={add}>
        <label htmlFor="add-category" className={styles.label}>
          Workout type
        </label>
        <div className={styles.row}>
          <select
            id="add-category"
            className={styles.select}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button type="submit" className={`${ui.button} ${ui.primary}`}>
            Add
          </button>
        </div>
        <p className={`${ui.muted} ${styles.hint}`}>
          Videos matching your usual session length are picked for you.
        </p>
      </form>
    </Dialog>
  )
}

export default AddSessionDialog
