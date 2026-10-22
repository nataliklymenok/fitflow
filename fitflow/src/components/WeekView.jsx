import { addDays, formatDay, isWithin, weekdayName } from '../domain/dates.js'
import MoodMark from './MoodMark.jsx'
import SessionCard from './SessionCard.jsx'
import styles from './WeekView.module.css'

// Seven days from `weekStart`. `renderRest(date)` adds controls to rest days.
// `compact` makes shorter tiles, for the overview on the Today screen.
function WeekView({
  weekStart,
  plan,
  sessionsByDate,
  today,
  renderRest,
  checkIns = {},
  compact = false,
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <ol className={`${styles.week} ${compact ? styles.compact : ''}`}>
      {days.map((date) => {
        const session = sessionsByDate.get(date)
        const inPlan = isWithin(date, plan.startDate, plan.endDate)
        const isToday = date === today
        return (
          <li
            key={date}
            className={`${styles.day} ${isToday ? styles.today : ''} ${inPlan ? '' : styles.outside}`}
            aria-current={isToday ? 'date' : undefined}
          >
            <div className={styles.dayHeader}>
              <span className={styles.weekday}>{weekdayName(date)}</span>
              <span className={styles.date}>{formatDay(date)}</span>
              <MoodMark mood={checkIns[date]?.mood} />
              {isToday && <span className={styles.todayLabel}>Today</span>}
            </div>
            {session ? (
              <SessionCard session={session} />
            ) : inPlan ? (
              <div className={styles.rest}>
                <span>Rest</span>
                {renderRest?.(date)}
              </div>
            ) : (
              <div className={styles.rest}>
                <span className={styles.outsideLabel}>Not in plan</span>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default WeekView
