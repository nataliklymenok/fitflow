import { describe, expect, it } from 'vitest'
import { isWithinTolerance, pickVideos, tolerance } from './pickVideos.js'
import { createRandom } from './random.js'

function videos(...minutes) {
  return minutes.map((durationMin, i) => ({ id: `v${i}-${durationMin}`, durationMin }))
}

function total(ids, pool) {
  return ids.reduce(
    (sum, id) => sum + pool.find((video) => video.id === id).durationMin,
    0,
  )
}

describe('tolerance', () => {
  it('is 5 minutes for short sessions and 25% for long ones', () => {
    expect(tolerance(10)).toBe(5)
    expect(tolerance(20)).toBe(5)
    expect(tolerance(30)).toBe(7.5)
    expect(tolerance(45)).toBe(11.25)
  })

  it('includes the edges', () => {
    expect(isWithinTolerance(25, 20)).toBe(true)
    expect(isWithinTolerance(26, 20)).toBe(false)
    expect(isWithinTolerance(15, 20)).toBe(true)
  })
})

describe('pickVideos', () => {
  const random = () => createRandom(1)

  it('prefers a single video within tolerance', () => {
    const pool = videos(5, 10, 20, 40)
    const ids = pickVideos({
      random: random(),
      candidates: pool,
      targetMinutes: 20,
      recentIds: new Set(),
    })
    expect(ids).toEqual(['v2-20'])
  })

  it('combines two videos when no single video fits', () => {
    const pool = videos(15, 15, 5)
    const ids = pickVideos({
      random: random(),
      candidates: pool,
      targetMinutes: 30,
      recentIds: new Set(),
    })
    expect(ids).toHaveLength(2)
    expect(isWithinTolerance(total(ids, pool), 30)).toBe(true)
  })

  it('combines three videos when two are not enough', () => {
    const pool = videos(10, 12, 15)
    const ids = pickVideos({
      random: random(),
      candidates: pool,
      targetMinutes: 45,
      recentIds: new Set(),
    })
    expect(ids).toHaveLength(3)
  })

  it('avoids recently used videos when another option fits', () => {
    const pool = videos(20, 22)
    for (let seed = 0; seed < 20; seed++) {
      const ids = pickVideos({
        random: createRandom(seed),
        candidates: pool,
        targetMinutes: 20,
        recentIds: new Set(['v0-20']),
      })
      expect(ids).toEqual(['v1-22'])
    }
  })

  it('repeats a recent video when nothing else fits', () => {
    const pool = videos(20, 45)
    const ids = pickVideos({
      random: random(),
      candidates: pool,
      targetMinutes: 20,
      recentIds: new Set(['v0-20']),
    })
    expect(ids).toEqual(['v0-20'])
  })

  it('falls back to the closest option when nothing fits', () => {
    const pool = videos(40, 45)
    const ids = pickVideos({
      random: random(),
      candidates: pool,
      targetMinutes: 10,
      recentIds: new Set(),
    })
    expect(ids).toEqual(['v0-40'])
  })

  it('returns no videos when there are no candidates', () => {
    expect(
      pickVideos({
        random: random(),
        candidates: [],
        targetMinutes: 20,
        recentIds: new Set(),
      }),
    ).toEqual([])
  })

  it('is deterministic for a seed', () => {
    const pool = videos(10, 10, 12, 15, 20, 20, 25)
    const run = () =>
      pickVideos({
        random: createRandom(7),
        candidates: pool,
        targetMinutes: 20,
        recentIds: new Set(),
      })
    expect(run()).toEqual(run())
  })
})
