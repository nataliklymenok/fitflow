// How quiz answers shape a plan (US-2): category weights and allowed intensity.
import { CATEGORIES } from './catalog.js'

// Points each answer adds per category, in the order of CATEGORIES:
//                       functional cardio stretching yoga calm
const POINTS = {
  mood: {
    stressed: [0, 0, 1, 2, 3],
    tired: [0, 0, 2, 2, 2],
    okay: [1, 1, 1, 1, 1],
    motivated: [2, 2, 0, 1, 0],
  },
  energy: {
    low: [0, 0, 2, 1, 2],
    medium: [1, 1, 1, 1, 0],
    high: [2, 3, 0, 1, 0],
  },
  goal: {
    stress: [0, 0, 1, 2, 4],
    flexibility: [0, 0, 4, 3, 1],
    fitness: [2, 4, 1, 1, 0],
    strength: [4, 1, 1, 0, 0],
  },
}

// Every category keeps at least this weight, so plans stay varied.
const MIN_WEIGHT = 1

export function categoryWeights(answers) {
  return Object.fromEntries(
    CATEGORIES.map((category, i) => {
      const points = Object.entries(POINTS).reduce(
        (sum, [question, table]) => sum + (table[answers[question]]?.[i] ?? 0),
        0,
      )
      return [category, Math.max(points, MIN_WEIGHT)]
    }),
  )
}

const INTENSITIES_BY_ENERGY = {
  low: ['low', 'medium'],
  medium: ['low', 'medium', 'high'],
  high: ['medium', 'high'],
}

// Calm and Stretching are gentle by nature and are never filtered out.
const ALWAYS_ALLOWED = ['calm', 'stretching']

export function isIntensityAllowed(video, energy) {
  return (
    ALWAYS_ALLOWED.includes(video.category) ||
    (INTENSITIES_BY_ENERGY[energy] ?? INTENSITIES_BY_ENERGY.medium).includes(
      video.intensity,
    )
  )
}
