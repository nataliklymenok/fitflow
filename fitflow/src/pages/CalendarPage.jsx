import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import MonthView from '../components/MonthView.jsx'
import WeekView from '../components/WeekView.jsx'
import {
  addDays,
  addMonths,
  formatDay,
  isWithin,
  startOfMonthKey,
  startOfWeekKey,
  todayKey,
} from '../domain/dates.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import styles from './CalendarPage.module.css'

const VIEWS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

// The visible period for a view: its first and last day, label and neighbours.
function periodFor(view, anchor) {
  if (view === 'month') {
    const start = startOfMonthKey(anchor)
    return {
      start,
      end: addDays(addMonths(start, 1), -1),
      label: formatDay(start, 'MMMM yyyy'),
      previous: addMonths(start, -1),
      next: addMonths(start, 1),
    }
  }
  const start = startOfWeekKey(anchor)
  return {
    start,
    end: addDays(start, 6),
    label: `${formatDay(start)} – ${formatDay(addDays(start, 6))}`,
    previous: addDays(start, -7),
    next: addDays(start, 7),
  }
}

function CalendarPage() {
  const { state } = usePlan()
  const { plan } = state
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'month' ? 'month' : 'week'
  const today = todayKey()
  const [anchor, setAnchor] = useState(() =>
    isWithin(today, plan.startDate, plan.endDate) ? today : plan.startDate,
  )

  const sessionsByDate = useMemo(
    () => new Map(plan.sessions.map((session) => [session.date, session])),
    [plan.sessions],
  )
  const done = plan.sessions.filter((s) => s.status === 'done').length

  const period = periodFor(view, anchor)
  const canGoBack = period.start > plan.startDate
  const canGoForward = period.end < plan.endDate
  const unit = view === 'month' ? 'month' : 'week'

  function setView(next) {
    setSearchParams(next === 'week' ? {} : { view: next }, { replace: true })
  }

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
            onClick={() => setAnchor(period.previous)}
            disabled={!canGoBack}
            aria-label={`Previous ${unit}`}
          >
            ‹
          </button>
          <h2 className={styles.period} aria-live="polite">
            {period.label}
          </h2>
          <button
            type="button"
            className={`${ui.button} ${ui.secondary} ${ui.small}`}
            onClick={() => setAnchor(period.next)}
            disabled={!canGoForward}
            aria-label={`Next ${unit}`}
          >
            ›
          </button>
        </div>

        <div className={styles.segmented} role="group" aria-label="Calendar view">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${styles.segment} ${view === id ? styles.active : ''}`}
              aria-pressed={view === id}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <MonthView
          month={period.start}
          plan={plan}
          sessionsByDate={sessionsByDate}
          today={today}
        />
      ) : (
        <WeekView
          weekStart={period.start}
          plan={plan}
          sessionsByDate={sessionsByDate}
          today={today}
        />
      )}
    </div>
  )
}

export default CalendarPage
