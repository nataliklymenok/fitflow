// What the Today screen shows (spec 002, US-1, FR-1, FR-2).

// The earliest planned session that `include` accepts, or null.
function firstPlanned(sessions, include = () => true) {
  return (
    sessions
      .filter((session) => session.status === 'planned' && include(session))
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  )
}

// One of:
//   { kind: 'upcoming', next }   the plan starts later
//   { kind: 'training', session } a session is planned for today (any status)
//   { kind: 'rest', next }        no session today; next may be null
//   { kind: 'finished' }          the plan has ended
export function todayStatus(plan, today) {
  if (today < plan.startDate) {
    return { kind: 'upcoming', next: firstPlanned(plan.sessions) }
  }
  if (today > plan.endDate) return { kind: 'finished' }

  const session = plan.sessions.find((s) => s.date === today)
  if (session) return { kind: 'training', session }
  return {
    kind: 'rest',
    next: firstPlanned(plan.sessions, (s) => s.date > today),
  }
}

// `minutesOf(session)` gives a session's total length. Minutes count only
// sessions marked done (FR-1).
export function planProgress(plan, minutesOf) {
  const done = plan.sessions.filter((session) => session.status === 'done')
  const total = plan.sessions.length
  return {
    done: done.length,
    total,
    minutesDone: done.reduce((sum, session) => sum + minutesOf(session), 0),
    fraction: total === 0 ? 0 : done.length / total,
  }
}
