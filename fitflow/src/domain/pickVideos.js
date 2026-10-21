// Fill one session with videos close to the target length (US-2).
import { pick } from './random.js'

// Allowed difference from the target: ±5 min or ±25%, whichever is larger.
export function tolerance(targetMinutes) {
  return Math.max(5, targetMinutes * 0.25)
}

export function isWithinTolerance(totalMinutes, targetMinutes) {
  return Math.abs(totalMinutes - targetMinutes) <= tolerance(targetMinutes)
}

// All groups of `size` videos (1–3) from `pool` whose total fits the target.
function fittingGroups(pool, size, targetMinutes) {
  const fits = (...group) =>
    isWithinTolerance(
      group.reduce((sum, video) => sum + video.durationMin, 0),
      targetMinutes,
    )
  const groups = []
  const n = pool.length
  for (let i = 0; i < n; i++) {
    if (size === 1) {
      if (fits(pool[i])) groups.push([pool[i]])
      continue
    }
    for (let j = i + 1; j < n; j++) {
      if (size === 2) {
        if (fits(pool[i], pool[j])) groups.push([pool[i], pool[j]])
        continue
      }
      for (let k = j + 1; k < n; k++) {
        if (fits(pool[i], pool[j], pool[k])) {
          groups.push([pool[i], pool[j], pool[k]])
        }
      }
    }
  }
  return groups
}

// Picks within tolerance from `pool`: one video if possible, else 2, else 3.
function pickFitting(random, pool, targetMinutes) {
  for (const size of [1, 2, 3]) {
    const groups = fittingGroups(pool, size, targetMinutes)
    if (groups.length > 0) return pick(random, groups)
  }
  return null
}

// When nothing fits, the single video or pair closest to the target.
function pickClosest(pool, targetMinutes) {
  let best = null
  let bestDistance = Infinity
  const consider = (group) => {
    const minutes = group.reduce((sum, video) => sum + video.durationMin, 0)
    const distance = Math.abs(minutes - targetMinutes)
    if (distance < bestDistance) {
      best = group
      bestDistance = distance
    }
  }
  for (let i = 0; i < pool.length; i++) {
    consider([pool[i]])
    for (let j = i + 1; j < pool.length; j++) consider([pool[i], pool[j]])
  }
  return best
}

// `pools`: lists of videos the session may use, most preferred first (e.g.
// matching intensity, then the whole category). `recentIds`: ids used in the
// previous 7 days. Order of preference: a fresh fit from any pool, then a fit
// that repeats a recent video, then the closest option. Returns video ids.
export function pickVideos({ random, pools, targetMinutes, recentIds }) {
  const nonEmpty = pools.filter((pool) => pool.length > 0)
  if (nonEmpty.length === 0) return []

  const fresh = nonEmpty.map((pool) =>
    pool.filter((video) => !recentIds.has(video.id)),
  )
  for (const pool of [...fresh, ...nonEmpty]) {
    const group = pickFitting(random, pool, targetMinutes)
    if (group) return group.map((video) => video.id)
  }
  return pickClosest(nonEmpty[0], targetMinutes).map((video) => video.id)
}
