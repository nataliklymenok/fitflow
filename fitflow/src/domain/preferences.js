// Who a plan is built from: chosen trainers and workout types (spec 004).
import { CATEGORIES, CATEGORY_LABELS } from './catalog.js'
import { isWithinTolerance } from './pickVideos.js'

export const MAX_TRAINERS = 5

// No trainers chosen means "any trainer".
export const DEFAULT_PREFERENCES = { trainers: [], categories: [...CATEGORIES] }

// Videos the plan may use: from the chosen trainers (all if none), in the
// workout types that are switched on.
export function allowedVideos(videos, preferences = DEFAULT_PREFERENCES) {
  const trainers = new Set(preferences.trainers)
  const categories = new Set(preferences.categories)
  return videos.filter(
    (video) =>
      (trainers.size === 0 || trainers.has(video.trainer)) && categories.has(video.category),
  )
}

// Workout types the allowed videos actually cover, in the usual order.
export function availableCategories(videos, preferences = DEFAULT_PREFERENCES) {
  const allowed = allowedVideos(videos, preferences)
  return CATEGORIES.filter((category) => allowed.some((video) => video.category === category))
}

// Problems with a choice, as sentences for the user; empty means it's fine.
export function validatePreferences(preferences, videos, trainers) {
  const errors = []
  const known = new Map(trainers.map((trainer) => [trainer.id, trainer]))
  if (preferences.trainers.length > MAX_TRAINERS) {
    errors.push(`Choose up to ${MAX_TRAINERS} trainers.`)
  }
  if (preferences.trainers.some((id) => !known.has(id))) {
    errors.push('One of the chosen trainers is no longer available.')
  }
  if (preferences.categories.length === 0) {
    errors.push('Keep at least one workout type switched on.')
  } else if (errors.length === 0 && allowedVideos(videos, preferences).length === 0) {
    const names = preferences.trainers.map((id) => known.get(id).name).join(' and ')
    const types = preferences.categories.map((c) => CATEGORY_LABELS[c]).join(' or ')
    errors.push(`${names} ${preferences.trainers.length === 1 ? 'has' : 'have'} no ${types} videos.`)
  }
  return errors
}

// True if some group of 1–3 videos from `pool` fits the target length.
function canFill(pool, targetMinutes) {
  const fits = (...group) =>
    isWithinTolerance(
      group.reduce((sum, video) => sum + video.durationMin, 0),
      targetMinutes,
    )
  for (let i = 0; i < pool.length; i++) {
    if (fits(pool[i])) return true
    for (let j = i + 1; j < pool.length; j++) {
      if (fits(pool[i], pool[j])) return true
      for (let k = j + 1; k < pool.length; k++) {
        if (fits(pool[i], pool[j], pool[k])) return true
      }
    }
  }
  return false
}

// Which available workout types cannot fill a session of this length
// (spec 004, US-4). `none` means no session of this length is possible.
export function coverage(videos, preferences, sessionMinutes) {
  const allowed = allowedVideos(videos, preferences)
  const available = availableCategories(videos, preferences)
  const uncovered = available.filter(
    (category) =>
      !canFill(
        allowed.filter((video) => video.category === category),
        sessionMinutes,
      ),
  )
  return { uncovered, none: available.length > 0 && uncovered.length === available.length }
}

// What a trainer card shows (spec 004, US-1).
export function trainerSummary(trainer, videos) {
  const own = videos.filter((video) => video.trainer === trainer.id)
  const minutes = own.map((video) => video.durationMin)
  return {
    categories: CATEGORIES.filter((category) => own.some((video) => video.category === category)),
    count: own.length,
    minMinutes: Math.min(...minutes),
    maxMinutes: Math.max(...minutes),
  }
}
