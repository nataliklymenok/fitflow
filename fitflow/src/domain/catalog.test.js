import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import trainersData from '../data/trainers.json'
import { CATEGORIES, validateCatalog } from './catalog.js'

const TRAINERS = [{ id: 'test', name: 'Test', channel: 'Test channel' }]

function video(overrides = {}) {
  return {
    id: 'abcdefghijk',
    title: 'Test video',
    channel: 'Test channel',
    trainer: 'test',
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
    expect(validateCatalog(catalog, trainersData.trainers)).toEqual([])
  })

  it('accepts a minimal valid catalog', () => {
    expect(validateCatalog(validCatalog(), TRAINERS)).toEqual([])
  })

  it('rejects a catalog without a video list', () => {
    expect(validateCatalog({}, TRAINERS)).toEqual(['catalog.videos must be a list'])
    expect(validateCatalog(null, TRAINERS)).toEqual(['catalog.videos must be a list'])
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
    const errors = validateCatalog(bad, TRAINERS)
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
    expect(validateCatalog(bad, TRAINERS)).toContain(
      `duplicate video id ${bad.videos[0].id}`,
    )
  })

  it('reports categories with too few videos', () => {
    const bad = validCatalog()
    bad.videos = bad.videos.filter((v, i) => !(v.category === 'calm' && i % 2))
    expect(validateCatalog(bad, TRAINERS)).toContain(
      'category calm has 5 videos, needs at least 10',
    )
  })
})

describe('trainers (004 FR-1)', () => {
  it('reports trainers with fewer than 8 videos', () => {
    const errors = validateCatalog(validCatalog(), [
      ...TRAINERS,
      { id: 'new', name: 'New', channel: 'New channel' },
    ])
    expect(errors).toContain('trainer new has 0 videos, needs at least 8')
  })

  it('reports videos with an unknown trainer or another channel', () => {
    const bad = validCatalog()
    bad.videos[0] = { ...bad.videos[0], trainer: 'nobody' }
    bad.videos[1] = { ...bad.videos[1], channel: 'Someone else' }
    const errors = validateCatalog(bad, TRAINERS)
    expect(errors.some((e) => e.includes('unknown trainer "nobody"'))).toBe(true)
    expect(errors.some((e) => e.includes('is not Test\'s channel'))).toBe(true)
  })

  it('every trainer in trainers.json has a unique id and a channel URL', () => {
    const ids = trainersData.trainers.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of trainersData.trainers) {
      expect(t.url).toMatch(/^https:\/\/www\.youtube\.com\/@/)
      expect(['en', 'uk']).toContain(t.language)
    }
  })
})
