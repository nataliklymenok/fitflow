// Streak and weekly progress on the Today screen (spec 003, US-3).
import { addDays, isWithin, startOfWeekKey } from './dates.js'

// Training days in a row with the session done, counting back from today.
// Rest days have no session, so they never break a streak. Today's session
// only counts once done: while it is still planned, the day isn't over.
export function streak(plan, today) {
  const past = plan.sessions
    .filter((session) => session.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))

  let count = 0
  for (const session of past) {
    if (session.date === today && session.status === 'planned') continue
    if (session.status !== 'done') break
    count++
  }
  return count
}

// Sessions and minutes for Monday to Sunday of today's week.
export function weekProgress(plan, today, minutesOf) {
  const start = startOfWeekKey(today)
  const end = addDays(start, 6)
  const inWeek = plan.sessions.filter((session) => isWithin(session.date, start, end))
  const done = inWeek.filter((session) => session.status === 'done')
  return {
    done: done.length,
    planned: inWeek.length,
    minutesDone: done.reduce((sum, session) => sum + minutesOf(session), 0),
  }
}
