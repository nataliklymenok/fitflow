import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { CATEGORIES, validateCatalog } from './catalog.js'

function video(overrides = {}) {
  return {
    id: 'abcdefghijk',
    title: 'Test video',
    channel: 'Test channel',
    durationMin: 20,
    category: 'yoga',
    intensity: 'low',
    tags: [],
    ...overrides,
  }
}

// Ten valid videos per category, with unique ids.
function validCatalog() {
  return {
    videos: CATEGORIES.flatMap((category, c) =>
      Array.from({ length: 10 }, (_, i) =>
        video({ id: `v${c}${i}`.padEnd(11, 'x'), category }),
      ),
    ),
  }
}

describe('validateCatalog', () => {
  it('accepts the shipped catalog (FR-1, FR-2)', () => {
    expect(validateCatalog(catalog)).toEqual([])
  })

  it('accepts a minimal valid catalog', () => {
    expect(validateCatalog(validCatalog())).toEqual([])
  })

  it('rejects a catalog without a video list', () => {
    expect(validateCatalog({})).toEqual(['catalog.videos must be a list'])
    expect(validateCatalog(null)).toEqual(['catalog.videos must be a list'])
  })

  it('reports invalid fields', () => {
    const bad = validCatalog()
    bad.videos[0] = video({
      id: 'short',
      title: '',
      durationMin: 50,
      category: 'pilates',
      intensity: 'extreme',
      tags: 'no-equipment',
    })
    const errors = validateCatalog(bad)
    expect(errors.some((e) => e.includes('11-character'))).toBe(true)
    expect(errors.some((e) => e.includes('title is required'))).toBe(true)
    expect(errors.some((e) => e.includes('durationMin'))).toBe(true)
    expect(errors.some((e) => e.includes('category must be'))).toBe(true)
    expect(errors.some((e) => e.includes('intensity must be'))).toBe(true)
    expect(errors.some((e) => e.includes('tags must be'))).toBe(true)
  })

  it('reports duplicate ids', () => {
    const bad = validCatalog()
    bad.videos.push({ ...bad.videos[0] })
    expect(validateCatalog(bad)).toContain(
      `duplicate video id ${bad.videos[0].id}`,
    )
  })

  it('reports categories with too few videos', () => {
    const bad = validCatalog()
    bad.videos = bad.videos.filter((v, i) => !(v.category === 'calm' && i % 2))
    expect(validateCatalog(bad)).toContain(
      'category calm has 5 videos, needs at least 10',
    )
  })
})
