import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import CheckIn from '../components/CheckIn.jsx'
import PlanActions from '../components/PlanActions.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Suggestion from '../components/Suggestion.jsx'
import SwapOptions from '../components/SwapOptions.jsx'
import WeekView from '../components/WeekView.jsx'
import { sessionMinutes, sessionVideos, videos } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { formatDay, isWithin, startOfWeekKey, todayKey } from '../domain/dates.js'
import { suggestAlternatives } from '../domain/suggestions.js'
import { streak, weekProgress } from '../domain/progress.js'
import { planProgress, todayStatus } from '../domain/today.js'
import { categoryVars } from '../lib/categoryVars.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import styles from './TodayPage.module.css'

const HEADINGS = {
  training: "Today's workout",
  rest: 'Rest day',
  upcoming: 'Starting soon',
  finished: 'Plan complete',
}

const twoDigits = (n) => String(n).padStart(2, '0')

// The home screen for a user with a plan (spec 002, US-1).
function TodayPage() {
  const { state } = usePlan()
  const { plan } = state
  const today = todayKey()
  const status = todayStatus(plan, today)
  const progress = planProgress(plan, sessionMinutes)
  const days = streak(plan, today)
  const week = weekProgress(plan, today, sessionMinutes)

  const sessionsByDate = useMemo(
    () => new Map(plan.sessions.map((session) => [session.date, session])),
    [plan.sessions],
  )
  const weekAnchor = isWithin(today, plan.startDate, plan.endDate)
    ? today
    : today < plan.startDate
      ? plan.startDate
      : plan.endDate

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{formatDay(today, 'EEEE · MMMM d')}</p>
        <h1 className={styles.title}>{HEADINGS[status.kind]}</h1>
      </header>

      {(status.kind === 'training' || status.kind === 'rest') && (
        <>
          <CheckIn date={today} record={state.checkIns[today]} />
          <Suggestion date={today} record={state.checkIns[today]} />
        </>
      )}

      <div className={styles.top}>
        {status.kind === 'training' && <WorkoutCard session={status.session} />}
        {(status.kind === 'rest' || status.kind === 'upcoming') && (
          <NextUp
            message={
              status.kind === 'rest'
                ? 'No workout today. Rest is part of the plan.'
                : `Your plan starts on ${formatDay(plan.startDate, 'EEEE, MMMM d')}.`
            }
            next={status.next}
          />
        )}
        {status.kind === 'finished' && (
          <section className={`${styles.card} ${styles.note}`} aria-label="Plan complete">
            <p className={styles.noteText}>
              You reached the end of your plan with {progress.done} of {progress.total}{' '}
              sessions done. Ready for the next one?
            </p>
            <PlanActions
              actions={['regenerate', 'retake']}
              className={styles.noteActions}
              buttonClassName=""
            />
          </section>
        )}

        <section className={styles.progress} aria-label="Plan progress">
          <div className={styles.tile}>
            <span className={styles.tileLabel}>Streak</span>
            {days > 0 ? (
              <span className={styles.big}>
                {days}
                <span className={styles.bigUnit}> {days === 1 ? 'day' : 'days'}</span>
              </span>
            ) : (
              <span className={styles.empty}>Finish a workout to start one</span>
            )}
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>This week</span>
            <span className={styles.big}>
              {twoDigits(week.done)}
              <span className={styles.faint}>/{twoDigits(week.planned)}</span>
            </span>
            <span className={styles.tileNote}>{week.minutesDone} min trained</span>
          </div>
          <div className={`${styles.tile} ${styles.wide}`}>
            <span className={styles.tileLabel}>
              Plan · {formatDay(plan.startDate)} – {formatDay(plan.endDate)}
            </span>
            <span className={styles.planLine}>
              <strong>
                {twoDigits(progress.done)}/{twoDigits(progress.total)}
              </strong>{' '}
              sessions · {progress.minutesDone} min trained
            </span>
            <div
              className={styles.bar}
              role="progressbar"
              aria-label="Sessions done"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
            >
              <div className={styles.fill} style={{ width: `${progress.fraction * 100}%` }} />
            </div>
          </div>
        </section>
      </div>

      <section className={styles.week} aria-labelledby="this-week">
        <div className={styles.weekHeader}>
          <h2 id="this-week" className={styles.sectionTitle}>
            This week
          </h2>
          <Link to="/calendar" className={styles.link}>
            Full calendar
          </Link>
        </div>
        <WeekView
          checkIns={state.checkIns}
          weekStart={startOfWeekKey(weekAnchor)}
          plan={plan}
          sessionsByDate={sessionsByDate}
          today={today}
          compact
        />
      </section>
    </div>
  )
}

function WorkoutCard({ session }) {
  const { dispatch } = usePlan()
  const [swapping, setSwapping] = useState(false)
  const items = sessionVideos(session)
  const first = items[0]

  function swap(option) {
    dispatch({ type: 'SWAP_VIDEO', id: session.id, index: 0, videoId: option.id })
    setSwapping(false)
  }

  return (
    <section
      className={`${styles.card} ${styles.workout}`}
      style={categoryVars(session.category)}
      aria-label="Today's workout"
    >
      <div className={styles.block}>
        <span className={styles.blockLabel}>{CATEGORY_LABELS[session.category]}</span>
        <span className={styles.minutes}>
          {sessionMinutes(session)}
          <span className={styles.unit}> min</span>
        </span>
      </div>
      <div className={styles.info}>
        <StatusBadge status={session.status} />
        <h2 className={styles.workoutTitle}>{first?.title}</h2>
        <p className={styles.channel}>
          {first?.channel}
          {items.length > 1 && ` · ${items.length} videos`}
        </p>
        <div className={styles.actions}>
          <Link to={`/session/${session.id}`} className={`${ui.button} ${ui.primary} ${styles.start}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
            Start
          </Link>
          <button
            type="button"
            className={`${ui.button} ${ui.secondary}`}
            aria-expanded={swapping}
            onClick={() => setSwapping(!swapping)}
          >
            Swap video
          </button>
        </div>
        {swapping && (
          <SwapOptions
            options={suggestAlternatives(videos, session, 0)}
            onChoose={swap}
            onCancel={() => setSwapping(false)}
          />
        )}
      </div>
    </section>
  )
}

function NextUp({ message, next }) {
  return (
    <section className={`${styles.card} ${styles.note}`} aria-label="Next workout">
      <p className={styles.noteText}>{message}</p>
      {next ? (
        <Link
          to={`/session/${next.id}`}
          className={styles.next}
          style={categoryVars(next.category)}
        >
          <span className={styles.nextLabel}>Next up</span>
          <span className={styles.nextWhat}>
            {formatDay(next.date, 'EEEE')} · {CATEGORY_LABELS[next.category]} ·{' '}
            {sessionMinutes(next)} min
          </span>
        </Link>
      ) : (
        <p className={styles.channel}>No more workouts planned.</p>
      )}
    </section>
  )
}

export default TodayPage
