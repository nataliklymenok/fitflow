// Quiz answers + catalog + seed → a workout plan (US-2, FR-3, FR-4).
import { addDays, daysBetween } from './dates.js'
import { pickVideos } from './pickVideos.js'
import { createRandom, weightedPick } from './random.js'
import { categoryWeights, isIntensityAllowed } from './weights.js'
import {
  DEFAULT_PREFERENCES,
  allowedVideos,
  availableCategories,
  coverage,
} from './preferences.js'

// Training days within each 7-day block, as offsets from the block's first
// day. Day 0 is always a training day, so the plan starts today.
export const DAY_PATTERNS = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
}

// The same category is not used more than this many sessions in a row.
export const MAX_SAME_CATEGORY_IN_A_ROW = 2

// A video is not repeated within this many days, if the catalog allows.
export const NO_REPEAT_DAYS = 7

export function trainingDates(startDate, weeks, daysPerWeek) {
  return Array.from({ length: weeks }, (_, week) =>
    DAY_PATTERNS[daysPerWeek].map((offset) => addDays(startDate, week * 7 + offset)),
  ).flat()
}

function chooseCategory(random, weights, previousCategories) {
  const lastFew = previousCategories.slice(-MAX_SAME_CATEGORY_IN_A_ROW)
  const repeated =
    lastFew.length === MAX_SAME_CATEGORY_IN_A_ROW &&
    lastFew.every((category) => category === lastFew[0])
  // With only one workout type available (spec 004), repeats are unavoidable.
  const choices = Object.values(weights).filter((weight) => weight > 0).length
  return weightedPick(
    random,
    repeated && choices > 1 ? { ...weights, [lastFew[0]]: 0 } : weights,
  )
}

// Category weights limited to the types the user's choice can fill at this
// session length (spec 004, US-3, US-4). If none can, all available types
// stay in, and sessions get the closest length possible.
export function planWeights(answers, videos, preferences) {
  const available = availableCategories(videos, preferences)
  const { uncovered } = coverage(videos, preferences, answers.sessionMinutes)
  const fillable = available.filter((category) => !uncovered.includes(category))
  const allowed = new Set(fillable.length > 0 ? fillable : available)
  return Object.fromEntries(
    Object.entries(categoryWeights(answers)).map(([category, weight]) => [
      category,
      allowed.has(category) ? weight : 0,
    ]),
  )
}

// Videos a session of `category` may use: those matching the user's energy
// first, then the whole category for when the first list cannot fill it.
export function candidatePools(videos, category, energy) {
  const inCategory = videos.filter((video) => video.category === category)
  const allowed = inCategory.filter((video) => isIntensityAllowed(video, energy))
  return [allowed, inCategory]
}

// Ids of videos used by `sessions` less than NO_REPEAT_DAYS before or after `date`.
export function recentVideoIds(sessions, date, excludeSessionId) {
  return new Set(
    sessions
      .filter(
        (session) =>
          session.id !== excludeSessionId &&
          Math.abs(daysBetween(session.date, date)) < NO_REPEAT_DAYS,
      )
      .flatMap((session) => session.videoIds),
  )
}

// New planned sessions on `dates`, after the `kept` ones (which count for the
// no-repeat window and the "2 in a row" rule). `videos` is already filtered
// by the user's preferences.
export function fillSessions({ dates, answers, videos, preferences, random, idPrefix, kept = [] }) {
  const weights = planWeights(answers, videos, preferences)
  const sessions = [...kept]
  for (const [index, date] of dates.entries()) {
    const previous = sessions.filter((s) => s.date < date).map((s) => s.category)
    const category = chooseCategory(random, weights, previous)
    const videoIds = pickVideos({
      random,
      pools: candidatePools(videos, category, answers.energy),
      targetMinutes: answers.sessionMinutes,
      recentIds: recentVideoIds(sessions, date),
    })
    sessions.push({ id: `${idPrefix}-${index}`, date, category, videoIds, status: 'planned' })
  }
  return sessions.slice(kept.length)
}

export function generatePlan(
  answers,
  catalog,
  { seed, today, preferences = DEFAULT_PREFERENCES },
) {
  const sessions = fillSessions({
    dates: trainingDates(today, answers.weeks, answers.daysPerWeek),
    answers,
    videos: allowedVideos(catalog.videos, preferences),
    preferences,
    random: createRandom(seed),
    idPrefix: `s-${seed.toString(36)}`,
  })

  return {
    startDate: today,
    endDate: addDays(today, answers.weeks * 7 - 1),
    seed,
    sessions,
  }
}
