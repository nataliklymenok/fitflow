// Quiz answers + catalog + seed → a workout plan (US-2, FR-3, FR-4).
import { addDays, daysBetween } from './dates.js'
import { pickVideos } from './pickVideos.js'
import { createRandom, weightedPick } from './random.js'
import { categoryWeights, isIntensityAllowed } from './weights.js'

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
  return weightedPick(
    random,
    repeated ? { ...weights, [lastFew[0]]: 0 } : weights,
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

export function generatePlan(answers, catalog, { seed, today }) {
  const random = createRandom(seed)
  const weights = categoryWeights(answers)
  const dates = trainingDates(today, answers.weeks, answers.daysPerWeek)

  const sessions = []
  for (const [index, date] of dates.entries()) {
    const category = chooseCategory(
      random,
      weights,
      sessions.map((session) => session.category),
    )
    const videoIds = pickVideos({
      random,
      pools: candidatePools(catalog.videos, category, answers.energy),
      targetMinutes: answers.sessionMinutes,
      recentIds: recentVideoIds(sessions, date),
    })
    sessions.push({
      id: `s-${seed.toString(36)}-${index}`,
      date,
      category,
      videoIds,
      status: 'planned',
    })
  }

  return {
    startDate: today,
    endDate: addDays(today, answers.weeks * 7 - 1),
    seed,
    sessions,
  }
}
