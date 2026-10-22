import { useMemo, useState } from 'react'
import WeekView from '../components/WeekView.jsx'
import {
  addDays,
  formatDay,
  isWithin,
  startOfWeekKey,
  todayKey,
} from '../domain/dates.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import styles from './CalendarPage.module.css'

function CalendarPage() {
  const { state } = usePlan()
  const { plan } = state
  const today = todayKey()
  const [anchor, setAnchor] = useState(() =>
    isWithin(today, plan.startDate, plan.endDate) ? today : plan.startDate,
  )

  const sessionsByDate = useMemo(
    () => new Map(plan.sessions.map((session) => [session.date, session])),
    [plan.sessions],
  )
  const done = plan.sessions.filter((s) => s.status === 'done').length

  const weekStart = startOfWeekKey(anchor)
  const weekEnd = addDays(weekStart, 6)
  const canGoBack = weekStart > plan.startDate
  const canGoForward = weekEnd < plan.endDate

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your plan</h1>
          <p className={`${ui.muted} ${styles.summary}`}>
            {formatDay(plan.startDate)} – {formatDay(plan.endDate)} · {done} of{' '}
            {plan.sessions.length} sessions done
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.periodNav}>
          <button
            type="button"
            className={`${ui.button} ${ui.secondary} ${ui.small}`}
            onClick={() => setAnchor(addDays(weekStart, -7))}
            disabled={!canGoBack}
            aria-label="Previous week"
          >
            ‹
          </button>
          <h2 className={styles.period} aria-live="polite">
            {formatDay(weekStart)} – {formatDay(weekEnd)}
          </h2>
          <button
            type="button"
            className={`${ui.button} ${ui.secondary} ${ui.small}`}
            onClick={() => setAnchor(addDays(weekStart, 7))}
            disabled={!canGoForward}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
      </div>

      <WeekView
        weekStart={weekStart}
        plan={plan}
        sessionsByDate={sessionsByDate}
        today={today}
      />
    </div>
  )
}

export default CalendarPage
