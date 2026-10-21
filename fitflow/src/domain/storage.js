// Saving the user's state in the browser (US-6, FR-5, FR-6).
// Every function survives missing, blocked or corrupted storage: the app then
// simply starts fresh.
import { CATEGORIES } from './catalog.js'
import { isKey, isWithin } from './dates.js'
import { STATUSES } from './planReducer.js'
import { isComplete } from './quiz.js'

export const STORAGE_KEY = 'fitflow'
export const SCHEMA_VERSION = 1

// Reading `window.localStorage` itself can throw (e.g. blocked cookies).
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isValidSession(session, plan) {
  return (
    typeof session?.id === 'string' &&
    isKey(session.date) &&
    isWithin(session.date, plan.startDate, plan.endDate) &&
    CATEGORIES.includes(session.category) &&
    Array.isArray(session.videoIds) &&
    session.videoIds.length > 0 &&
    session.videoIds.every((id) => typeof id === 'string') &&
    STATUSES.includes(session.status)
  )
}

function isValidPlan(plan) {
  return (
    isKey(plan?.startDate) &&
    isKey(plan.endDate) &&
    plan.startDate <= plan.endDate &&
    Number.isInteger(plan.seed) &&
    Array.isArray(plan.sessions) &&
    plan.sessions.every((session) => isValidSession(session, plan))
  )
}

export function isValidState(state) {
  return isComplete(state?.answers) && isValidPlan(state.plan)
}

// Upgrades older saved data to SCHEMA_VERSION; null if it cannot.
export function migrate(data) {
  if (data?.version === SCHEMA_VERSION) return data
  return null
}

// Returns { answers, plan } or null when there is nothing usable.
export function load(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = migrate(JSON.parse(raw))
    if (!data) return null
    const state = { answers: data.answers, plan: data.plan }
    return isValidState(state) ? state : null
  } catch {
    return null
  }
}

// Returns true if the state was saved.
export function save(state, storage = defaultStorage()) {
  try {
    if (!storage) return false
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        answers: state.answers,
        plan: state.plan,
      }),
    )
    return true
  } catch {
    return false
  }
}

export function clear(storage = defaultStorage()) {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
