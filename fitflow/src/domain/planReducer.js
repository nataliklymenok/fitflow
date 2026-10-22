// Every change to the user's plan (US-4, US-5, US-6) goes through this reducer.
// It is pure: anything random (choosing new videos) happens in the action
// creators below, and the reducer only applies their result.
import { CATEGORIES } from './catalog.js'
import { MOODS } from './checkIn.js'
import { isKey, isWithin } from './dates.js'
import { candidatePools, recentVideoIds } from './generatePlan.js'
import { pickVideos } from './pickVideos.js'
import { createRandom } from './random.js'

export const STATUSES = ['planned', 'done', 'skipped']

export const EMPTY_STATE = { answers: null, plan: null, checkIns: {} }

function byDate(a, b) {
  return a.date.localeCompare(b.date)
}

function inPlanRange(plan, date) {
  return isKey(date) && isWithin(date, plan.startDate, plan.endDate)
}

function updateSessions(state, update) {
  return { ...state, plan: { ...state.plan, sessions: update(state.plan.sessions) } }
}

function updateSession(state, id, update) {
  if (!state.plan.sessions.some((session) => session.id === id)) return state
  return updateSessions(state, (sessions) =>
    sessions.map((session) => (session.id === id ? update(session) : session)),
  )
}

const NO_DECISION = { decision: null, previous: null, sessionId: null }

function setCheckIn(state, date, record) {
  return { ...state, checkIns: { ...state.checkIns, [date]: record } }
}

function replaceSession(sessions, id, replacement) {
  return sessions.map((session) => (session.id === id ? replacement : session))
}

export function planReducer(state, action) {
  if (action.type === 'REPLACE_PLAN') {
    // A new plan keeps how the user felt each day (003 FR-2), but not what
    // they did with suggestions, which pointed at the old plan's sessions.
    return {
      answers: action.answers,
      plan: action.plan,
      checkIns: Object.fromEntries(
        Object.entries(state.checkIns ?? {}).map(([date, { mood }]) => [
          date,
          { mood, decision: null, previous: null, sessionId: null },
        ]),
      ),
    }
  }
  if (action.type === 'RESET') return EMPTY_STATE
  if (!state.plan) return state

  switch (action.type) {
    case 'MOVE_SESSION': {
      const moving = state.plan.sessions.find((s) => s.id === action.id)
      if (!moving || !inPlanRange(state.plan, action.toDate)) return state
      if (moving.date === action.toDate) return state
      const other = state.plan.sessions.find((s) => s.date === action.toDate)
      return updateSessions(state, (sessions) =>
        sessions
          .map((session) => {
            if (session.id === moving.id) return { ...session, date: action.toDate }
            if (session.id === other?.id) return { ...session, date: moving.date }
            return session
          })
          .sort(byDate),
      )
    }

    case 'SWAP_VIDEO':
      return updateSession(state, action.id, (session) => {
        if (action.index < 0 || action.index >= session.videoIds.length) {
          return session
        }
        const videoIds = [...session.videoIds]
        videoIds[action.index] = action.videoId
        return { ...session, videoIds }
      })

    case 'CHANGE_CATEGORY':
      if (!CATEGORIES.includes(action.category) || action.videoIds.length === 0) {
        return state
      }
      return updateSession(state, action.id, (session) => ({
        ...session,
        category: action.category,
        videoIds: action.videoIds,
      }))

    case 'DELETE_SESSION':
      return updateSessions(state, (sessions) =>
        sessions.filter((session) => session.id !== action.id),
      )

    case 'ADD_SESSION': {
      const { session } = action
      const taken = state.plan.sessions.some(
        (s) => s.date === session.date || s.id === session.id,
      )
      if (taken || !inPlanRange(state.plan, session.date)) return state
      if (session.videoIds.length === 0) return state
      return updateSessions(state, (sessions) => [...sessions, session].sort(byDate))
    }

    case 'SET_STATUS':
      if (!STATUSES.includes(action.status)) return state
      return updateSession(state, action.id, (session) => ({
        ...session,
        status: action.status,
      }))

    // Daily check-in (spec 003, US-1, US-2)

    case 'SET_CHECK_IN': {
      if (!MOODS.includes(action.mood) || !inPlanRange(state.plan, action.date)) {
        return state
      }
      const current = state.checkIns[action.date]
      // Changing the mood keeps an applied suggestion (it can still be undone)
      // but brings back an unanswered one.
      const outcome = current?.decision === 'adapted' ? current : NO_DECISION
      return setCheckIn(state, action.date, {
        mood: action.mood,
        decision: outcome.decision,
        previous: outcome.previous,
        sessionId: outcome.sessionId,
      })
    }

    case 'KEEP_PLAN': {
      const current = state.checkIns[action.date]
      if (!current || current.decision !== null) return state
      return setCheckIn(state, action.date, { ...current, decision: 'kept' })
    }

    case 'ADAPT_TODAY': {
      const current = state.checkIns[action.date]
      const { session, previous } = action
      if (!current || current.decision !== null || session.date !== action.date) {
        return state
      }
      const sessions = state.plan.sessions
      if (previous) {
        if (!sessions.some((s) => s.id === previous.id)) return state
      } else if (sessions.some((s) => s.date === action.date)) {
        return state
      }
      const next = updateSessions(state, (all) =>
        previous ? replaceSession(all, previous.id, session) : [...all, session].sort(byDate),
      )
      return setCheckIn(next, action.date, {
        ...current,
        decision: 'adapted',
        previous: previous ?? null,
        sessionId: session.id,
      })
    }

    case 'UNDO_ADAPTATION': {
      const current = state.checkIns[action.date]
      if (current?.decision !== 'adapted') return state
      const next = updateSessions(state, (all) =>
        current.previous
          ? replaceSession(all, current.sessionId, current.previous)
          : all.filter((session) => session.id !== current.sessionId),
      )
      return setCheckIn(next, action.date, { mood: current.mood, ...NO_DECISION })
    }

    default:
      return state
  }
}

// Picks videos for a session of `category` on `date`, avoiding videos used
// within 7 days by the other sessions of the plan.
function pickFor(state, videos, { date, category, seed, sessionId }) {
  return pickVideos({
    random: createRandom(seed),
    pools: candidatePools(videos, category, state.answers.energy),
    targetMinutes: state.answers.sessionMinutes,
    recentIds: recentVideoIds(state.plan.sessions, date, sessionId),
  })
}

export function changeCategory(state, videos, { id, category, seed }) {
  const session = state.plan.sessions.find((s) => s.id === id)
  return {
    type: 'CHANGE_CATEGORY',
    id,
    category,
    videoIds: session
      ? pickFor(state, videos, { date: session.date, category, seed, sessionId: id })
      : [],
  }
}

export function addSession(state, videos, { date, category, seed }) {
  return {
    type: 'ADD_SESSION',
    session: {
      id: `s-${date}-${seed.toString(36)}`,
      date,
      category,
      videoIds: pickFor(state, videos, { date, category, seed }),
      status: 'planned',
    },
  }
}
