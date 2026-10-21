// Every change to the user's plan (US-4, US-5, US-6) goes through this reducer.
// It is pure: anything random (choosing new videos) happens in the action
// creators below, and the reducer only applies their result.
import { CATEGORIES } from './catalog.js'
import { isKey, isWithin } from './dates.js'
import { candidatePools, recentVideoIds } from './generatePlan.js'
import { pickVideos } from './pickVideos.js'
import { createRandom } from './random.js'

export const STATUSES = ['planned', 'done', 'skipped']

export const EMPTY_STATE = { answers: null, plan: null }

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

export function planReducer(state, action) {
  if (action.type === 'REPLACE_PLAN') {
    return { answers: action.answers, plan: action.plan }
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
