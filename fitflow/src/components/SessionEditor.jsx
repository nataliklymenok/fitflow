import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { formatDay, rangeKeys } from '../domain/dates.js'
import { changeCategory } from '../domain/planReducer.js'
import { newSeed } from '../domain/random.js'
import { usePlan } from '../state/planContext.js'
import { useAllowedVideos } from '../state/useAllowedVideos.js'
import ui from '../styles/ui.module.css'
import Dialog from './Dialog.jsx'
import styles from './SessionEditor.module.css'

// Move, change category or delete a session (US-5).
function SessionEditor({ open, onClose, session }) {
  const { state, dispatch } = usePlan()
  const { videos, categories } = useAllowedVideos()
  const navigate = useNavigate()
  const { plan } = state
  const [toDate, setToDate] = useState(session.date)
  const [category, setCategory] = useState(session.category)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sessionsByDate = new Map(plan.sessions.map((s) => [s.date, s]))

  function close() {
    setConfirmDelete(false)
    onClose()
  }

  function move(event) {
    event.preventDefault()
    dispatch({ type: 'MOVE_SESSION', id: session.id, toDate })
    close()
  }

  function change(event) {
    event.preventDefault()
    dispatch(changeCategory(state, videos, { id: session.id, category, seed: newSeed() }))
    close()
  }

  function remove() {
    dispatch({ type: 'DELETE_SESSION', id: session.id })
    navigate('/calendar')
  }

  return (
    <Dialog open={open} onClose={close} title="Edit session">
      <form className={styles.section} onSubmit={move}>
        <label htmlFor="move-to" className={styles.label}>
          Move to another day
        </label>
        <div className={styles.row}>
          <select
            id="move-to"
            className={styles.select}
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          >
            {rangeKeys(plan.startDate, plan.endDate).map((date) => {
              const other = sessionsByDate.get(date)
              const note =
                date === session.date
                  ? ' (this session)'
                  : other
                    ? ` (swap with ${CATEGORY_LABELS[other.category]})`
                    : ''
              return (
                <option key={date} value={date}>
                  {formatDay(date, 'EEE, MMM d')}
                  {note}
                </option>
              )
            })}
          </select>
          <button
            type="submit"
            className={`${ui.button} ${ui.secondary}`}
            disabled={toDate === session.date}
          >
            Move
          </button>
        </div>
      </form>

      <form className={styles.section} onSubmit={change}>
        <label htmlFor="category" className={styles.label}>
          Change workout type
        </label>
        <div className={styles.row}>
          <select
            id="category"
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
          <button
            type="submit"
            className={`${ui.button} ${ui.secondary}`}
            disabled={category === session.category}
          >
            Change
          </button>
        </div>
        <p className={`${ui.muted} ${styles.hint}`}>
          New videos of the same total length are picked for you.
        </p>
      </form>

      <div className={styles.section}>
        {confirmDelete ? (
          <div className={styles.row}>
            <span className={styles.label}>Delete this session?</span>
            <button
              type="button"
              className={`${ui.button} ${ui.secondary}`}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${ui.button} ${ui.danger}`}
              onClick={remove}
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`${ui.button} ${ui.ghost} ${styles.delete}`}
            onClick={() => setConfirmDelete(true)}
          >
            Delete session
          </button>
        )}
      </div>
    </Dialog>
  )
}

export default SessionEditor
