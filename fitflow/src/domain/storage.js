// Saving the user's state in the browser (US-6, FR-5, FR-6).
// Every function survives missing, blocked or corrupted storage: the app then
// simply starts fresh.
import { CATEGORIES } from './catalog.js'
import { DECISIONS, MOODS } from './checkIn.js'
import { DEFAULT_PREFERENCES, MAX_TRAINERS } from './preferences.js'
import { isKey, isWithin } from './dates.js'
import { STATUSES } from './planReducer.js'
import { isComplete } from './quiz.js'

export const STORAGE_KEY = 'fitflow'
export const SCHEMA_VERSION = 3

// The theme is kept apart from the plan, so Reset does not change it (002 FR-4).
// index.html reads the same key before the app loads; keep the two in sync.
export const THEME_KEY = 'fitflow:theme'
export const THEMES = ['dark', 'light']

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

function isValidCheckIn(record, plan) {
  return (
    MOODS.includes(record?.mood) &&
    DECISIONS.includes(record.decision) &&
    (record.previous === null || isValidSession(record.previous, plan)) &&
    (record.sessionId === null || typeof record.sessionId === 'string')
  )
}

function isValidCheckIns(checkIns, plan) {
  return (
    checkIns !== null &&
    typeof checkIns === 'object' &&
    !Array.isArray(checkIns) &&
    Object.entries(checkIns).every(
      ([date, record]) => isKey(date) && isValidCheckIn(record, plan),
    )
  )
}

function isValidPreferences(preferences) {
  return (
    Array.isArray(preferences?.trainers) &&
    preferences.trainers.length <= MAX_TRAINERS &&
    preferences.trainers.every((id) => typeof id === 'string') &&
    Array.isArray(preferences.categories) &&
    preferences.categories.length > 0 &&
    preferences.categories.every((c) => CATEGORIES.includes(c))
  )
}

export function isValidState(state) {
  return (
    isComplete(state?.answers) &&
    isValidPlan(state.plan) &&
    isValidCheckIns(state.checkIns, state.plan) &&
    isValidPreferences(state.preferences)
  )
}

// Upgrades older saved data to SCHEMA_VERSION, one version at a time; null if
// it cannot.
export function migrate(data) {
  let current = data
  if (current?.version === 1) {
    // 003: daily check-ins were added.
    current = { ...current, version: 2, checkIns: {} }
  }
  if (current?.version === 2) {
    // 004: chosen trainers and workout types; old plans used any trainer.
    current = { ...current, version: 3, preferences: DEFAULT_PREFERENCES }
  }
  return current?.version === SCHEMA_VERSION ? current : null
}

// Returns { answers, plan, checkIns } or null when there is nothing usable.
export function load(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = migrate(JSON.parse(raw))
    if (!data) return null
    const state = {
      answers: data.answers,
      plan: data.plan,
      checkIns: data.checkIns,
      preferences: data.preferences,
    }
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
        checkIns: state.checkIns ?? {},
        preferences: state.preferences ?? DEFAULT_PREFERENCES,
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

// Returns 'dark', 'light', or null when no valid choice is saved.
export function loadTheme(storage = defaultStorage()) {
  try {
    const theme = storage?.getItem(THEME_KEY)
    return THEMES.includes(theme) ? theme : null
  } catch {
    return null
  }
}

// Returns true if the theme was saved.
export function saveTheme(theme, storage = defaultStorage()) {
  if (!THEMES.includes(theme)) return false
  try {
    if (!storage) return false
    storage.setItem(THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}
