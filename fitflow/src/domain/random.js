// Seeded pseudo-random numbers, so that plan generation is reproducible (FR-3).

// mulberry32: small, fast and good enough for shuffling workouts.
export function createRandom(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 32)
}

export function pick(random, items) {
  if (items.length === 0) return undefined
  return items[Math.floor(random() * items.length)]
}

// `weights` maps item → weight. Items with weight <= 0 are never picked.
export function weightedPick(random, weights) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (total === 0) return undefined

  let roll = random() * total
  for (const [item, weight] of entries) {
    roll -= weight
    if (roll < 0) return item
  }
  return entries[entries.length - 1][0]
}

// Returns a shuffled copy (Fisher–Yates).
export function shuffle(random, items) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
