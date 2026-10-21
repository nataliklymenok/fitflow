// Fill one session with videos close to the target length (US-2).
import { pick } from './random.js'

// Allowed difference from the target: ±5 min or ±25%, whichever is larger.
export function tolerance(targetMinutes) {
  return Math.max(5, targetMinutes * 0.25)
}

export function isWithinTolerance(totalMinutes, targetMinutes) {
  return Math.abs(totalMinutes - targetMinutes) <= tolerance(targetMinutes)
}

function sumMinutes(videos) {
  return videos.reduce((sum, video) => sum + video.durationMin, 0)
}

function combinations(items, size, start = 0, prefix = []) {
  if (prefix.length === size) return [prefix]
  const result = []
  for (let i = start; i < items.length; i++) {
    result.push(...combinations(items, size, i + 1, [...prefix, items[i]]))
  }
  return result
}

// Picks within tolerance from `pool`: one video if possible, else 2, else 3.
function pickFitting(random, pool, targetMinutes) {
  for (const size of [1, 2, 3]) {
    const fitting = combinations(pool, size).filter((group) =>
      isWithinTolerance(sumMinutes(group), targetMinutes),
    )
    if (fitting.length > 0) return pick(random, fitting)
  }
  return null
}

// When nothing fits, the single video or pair closest to the target.
function pickClosest(pool, targetMinutes) {
  const groups = [...combinations(pool, 1), ...combinations(pool, 2)]
  const distance = (group) => Math.abs(sumMinutes(group) - targetMinutes)
  return groups.reduce((best, group) =>
    distance(group) < distance(best) ? group : best,
  )
}

// `candidates`: videos the session may use (already filtered by category and
// intensity). `recentIds`: video ids used in the previous 7 days, avoided
// unless nothing else fits. Returns a list of video ids.
export function pickVideos({ random, candidates, targetMinutes, recentIds }) {
  if (candidates.length === 0) return []

  const fresh = candidates.filter((video) => !recentIds.has(video.id))
  const group =
    pickFitting(random, fresh, targetMinutes) ??
    pickFitting(random, candidates, targetMinutes) ??
    pickClosest(candidates, targetMinutes)

  return group.map((video) => video.id)
}
