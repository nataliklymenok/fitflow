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
import { categoryVars } from '../lib/categoryVars.js'
import ui from '../styles/ui.module.css'
import MoodMark from './MoodMark.jsx'
import styles from './MonthView.module.css'

const STATUS_TEXT = { planned: '', done: ', done', skipped: ', skipped' }

function MonthView({ month, plan, sessionsByDate, today, checkIns = {} }) {
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
              <span className={styles.cellTop}>
                <span className={styles.dayNumber}>{formatDay(date, 'd')}</span>
                <MoodMark mood={checkIns[date]?.mood} />
              </span>
              {session && (
                <Link
                  to={`/session/${session.id}`}
                  className={`${styles.session} ${styles[session.status]}`}
                  style={categoryVars(session.category)}
                >
                  <span className={styles.label}>
                    {session.status === 'done' && <span aria-hidden="true">✓ </span>}
                    {CATEGORY_LABELS[session.category]}
                  </span>
                  <span className={styles.minutes}>
                    <span className={ui.visuallyHidden}>, </span>
                    {sessionMinutes(session)}
                    <span aria-hidden="true">′</span>
                    <span className={ui.visuallyHidden}>
                      {' '}min, {formatDay(date, 'EEEE, MMMM d')}
                      {STATUS_TEXT[session.status]}
                    </span>
                  </span>
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
              style={categoryVars(category)}
            />
            {CATEGORY_LABELS[category]}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MonthView
