import { Link } from 'react-router'
import { sessionMinutes } from '../data/videos.js'
import { CATEGORIES, CATEGORY_LABELS } from '../domain/catalog.js'
import {
  formatDay,
  isWithin,
  monthGridKeys,
  startOfMonthKey,
  weekdayName,
} from '../domain/dates.js'
import styles from './MonthView.module.css'

const STATUS_TEXT = { planned: '', done: ', done', skipped: ', skipped' }

function MonthView({ month, plan, sessionsByDate, today }) {
  const days = monthGridKeys(month)
  const monthStart = startOfMonthKey(month)

  return (
    <div className={styles.month}>
      <div className={styles.weekdays} aria-hidden="true">
        {days.slice(0, 7).map((date) => (
          <span key={date}>{weekdayName(date)}</span>
        ))}
      </div>
      <ol className={styles.grid}>
        {days.map((date) => {
          const session = sessionsByDate.get(date)
          const inMonth = startOfMonthKey(date) === monthStart
          const inPlan = isWithin(date, plan.startDate, plan.endDate)
          const isToday = date === today
          const classes = [
            styles.cell,
            inMonth ? '' : styles.otherMonth,
            inPlan ? '' : styles.outside,
            isToday ? styles.today : '',
          ].join(' ')

          return (
            <li
              key={date}
              className={classes}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className={styles.dayNumber}>{formatDay(date, 'd')}</span>
              {session && (
                <Link
                  to={`/session/${session.id}`}
                  className={`${styles.session} ${styles[session.status]}`}
                  style={{ '--category-color': `var(--color-${session.category})` }}
                  aria-label={`${formatDay(date, 'EEEE, MMMM d')}: ${CATEGORY_LABELS[session.category]}, ${sessionMinutes(session)} min${STATUS_TEXT[session.status]}`}
                >
                  <span className={styles.label}>
                    {session.status === 'done' && '✓ '}
                    {CATEGORY_LABELS[session.category]}
                  </span>
                  <span className={styles.minutes}>{sessionMinutes(session)}′</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
      <ul className={styles.legend} aria-label="Categories">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <span
              className={styles.swatch}
              style={{ '--category-color': `var(--color-${category})` }}
            />
            {CATEGORY_LABELS[category]}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MonthView
