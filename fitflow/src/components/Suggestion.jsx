import { useMemo } from 'react'
import { sessionMinutes, sessionVideos } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { suggestFor } from '../domain/checkIn.js'
import { categoryVars } from '../lib/categoryVars.js'
import { usePlan } from '../state/planContext.js'
import { useAllowedVideos } from '../state/useAllowedVideos.js'
import ui from '../styles/ui.module.css'
import TrainerLink from './TrainerLink.jsx'
import styles from './Suggestion.module.css'

const REASONS = {
  'low-swap': "You're feeling low, so here's something gentler.",
  'ready-swap': "You're ready for more, so here's something more active.",
  'ready-add': "Feeling ready on a rest day? Here's a short session, if you want it.",
}

// What the check-in suggests for today, and its outcome (spec 003, US-2).
function Suggestion({ date, record }) {
  const { state, dispatch } = usePlan()
  const { plan, answers } = state
  const { videos } = useAllowedVideos()

  const suggestion = useMemo(
    () =>
      record && record.decision === null
        ? suggestFor({ plan, answers, date, mood: record.mood, videos })
        : null,
    [plan, answers, date, record, videos],
  )

  if (record?.decision === 'adapted') {
    const session = plan.sessions.find((s) => s.id === record.sessionId)
    return (
      <section className={`${styles.card} ${styles.applied}`} aria-label="Suggestion">
        <p className={styles.appliedText} role="status">
          {record.previous ? 'Swapped to' : 'Added'}{' '}
          <strong>
            {session ? `${CATEGORY_LABELS[session.category]} · ${sessionMinutes(session)} min` : 'a new session'}
          </strong>
        </p>
        <button
          type="button"
          className={`${ui.button} ${ui.secondary} ${ui.small}`}
          onClick={() => dispatch({ type: 'UNDO_ADAPTATION', date })}
        >
          Undo
        </button>
      </section>
    )
  }

  if (!suggestion) return null

  const { session, kind } = suggestion
  const items = sessionVideos(session)
  const first = items[0]
  const isAdd = kind === 'add'

  return (
    <section className={styles.card} aria-label="Suggestion" style={categoryVars(session.category)}>
      <div className={styles.block}>
        <span className={styles.blockLabel}>{CATEGORY_LABELS[session.category]}</span>
        <span className={styles.minutes}>
          {sessionMinutes(session)}
          <span className={styles.unit}> min</span>
        </span>
      </div>
      <div className={styles.body}>
        <p className={styles.reason}>{REASONS[`${record.mood}-${kind}`]}</p>
        <p className={styles.title}>{first?.title}</p>
        <p className={styles.channel}>
          {first && <TrainerLink video={first} />}
          {items.length > 1 && ` · ${items.length} videos`}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${ui.button} ${ui.primary}`}
            onClick={() =>
              dispatch({
                type: 'ADAPT_TODAY',
                date,
                session,
                previous: suggestion.replaces ?? null,
              })
            }
          >
            {isAdd ? 'Add it' : 'Swap to this'}
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.secondary}`}
            onClick={() => dispatch({ type: 'KEEP_PLAN', date })}
          >
            {isAdd ? 'Rest anyway' : 'Keep my plan'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default Suggestion
