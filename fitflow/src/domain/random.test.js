import { describe, expect, it } from 'vitest'
import { createRandom, pick, shuffle, weightedPick } from './random.js'

function take(random, count) {
  return Array.from({ length: count }, () => random())
}

describe('createRandom', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take(createRandom(42), 5)).toEqual(take(createRandom(42), 5))
  })

  it('gives different sequences for different seeds', () => {
    expect(take(createRandom(1), 5)).not.toEqual(take(createRandom(2), 5))
  })

  it('returns numbers in [0, 1)', () => {
    for (const value of take(createRandom(7), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('pick', () => {
  it('returns an item from the list, or undefined for an empty list', () => {
    const random = createRandom(3)
    expect(['a', 'b', 'c']).toContain(pick(random, ['a', 'b', 'c']))
    expect(pick(random, [])).toBeUndefined()
  })
})

describe('weightedPick', () => {
  it('never picks items with zero weight', () => {
    const random = createRandom(5)
    for (let i = 0; i < 200; i++) {
      expect(weightedPick(random, { a: 1, b: 0, c: 3 })).not.toBe('b')
    }
  })

  it('follows the weights roughly', () => {
    const random = createRandom(9)
    const counts = { a: 0, b: 0 }
    for (let i = 0; i < 4000; i++) counts[weightedPick(random, { a: 1, b: 3 })]++
    expect(counts.b / counts.a).toBeGreaterThan(2.5)
    expect(counts.b / counts.a).toBeLessThan(3.5)
  })

  it('returns undefined when every weight is zero', () => {
    expect(weightedPick(createRandom(1), { a: 0 })).toBeUndefined()
  })
})

describe('shuffle', () => {
  it('keeps the same items and does not change the input', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffle(createRandom(11), items)
    expect([...shuffled].sort()).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  it('is reproducible for a seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(shuffle(createRandom(4), items)).toEqual(
      shuffle(createRandom(4), items),
    )
  })
})
