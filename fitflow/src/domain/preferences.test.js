import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import trainersData from '../data/trainers.json'
import { CATEGORIES } from './catalog.js'
import {
  DEFAULT_PREFERENCES,
  allowedVideos,
  availableCategories,
  coverage,
  trainerSummary,
  validatePreferences,
} from './preferences.js'

const videos = catalog.videos
const { trainers } = trainersData
const prefs = (trainerIds, categories = CATEGORIES) => ({ trainers: trainerIds, categories })

describe('allowedVideos', () => {
  it('allows everything by default', () => {
    expect(allowedVideos(videos, DEFAULT_PREFERENCES)).toHaveLength(videos.length)
  })

  it('keeps only the chosen trainers', () => {
    const allowed = allowedVideos(videos, prefs(['caroline-girvan', 'ania-lu']))
    expect(allowed.length).toBeGreaterThan(0)
    expect(new Set(allowed.map((v) => v.trainer))).toEqual(new Set(['caroline-girvan', 'ania-lu']))
  })

  it('keeps only the switched-on types, for any trainer too', () => {
    const allowed = allowedVideos(videos, prefs([], ['yoga', 'stretching']))
    expect(new Set(allowed.map((v) => v.category))).toEqual(new Set(['yoga', 'stretching']))
  })

  it('combines both: one trainer, one type', () => {
    const allowed = allowedVideos(videos, prefs(['pamela-reif'], ['stretching']))
    expect(allowed.every((v) => v.trainer === 'pamela-reif' && v.category === 'stretching')).toBe(true)
    expect(allowed.length).toBeGreaterThan(0)
  })
})

describe('availableCategories', () => {
  it('lists the types the chosen trainers teach', () => {
    expect(availableCategories(videos, prefs(['tom-merrick']))).toEqual(['stretching'])
    expect(availableCategories(videos, DEFAULT_PREFERENCES)).toEqual(CATEGORIES)
  })
})

describe('validatePreferences', () => {
  it('accepts the default and a normal choice', () => {
    expect(validatePreferences(DEFAULT_PREFERENCES, videos, trainers)).toEqual([])
    expect(validatePreferences(prefs(['madfit']), videos, trainers)).toEqual([])
  })

  it('refuses more than 5 trainers', () => {
    const six = trainers.slice(0, 6).map((t) => t.id)
    expect(validatePreferences(prefs(six), videos, trainers)).toEqual(['Choose up to 5 trainers.'])
  })

  it('refuses switching every type off', () => {
    expect(validatePreferences(prefs([], []), videos, trainers)).toEqual([
      'Keep at least one workout type switched on.',
    ])
  })

  it('explains a choice that leaves no videos', () => {
    expect(validatePreferences(prefs(['tom-merrick'], ['yoga']), videos, trainers)).toEqual([
      'Tom Merrick has no Yoga videos.',
    ])
  })

  it('refuses unknown trainers', () => {
    expect(validatePreferences(prefs(['nobody']), videos, trainers)).toEqual([
      'One of the chosen trainers is no longer available.',
    ])
  })
})

describe('coverage (004 US-4)', () => {
  it('finds nothing missing for any trainer', () => {
    for (const minutes of [10, 20, 30, 45]) {
      expect(coverage(videos, DEFAULT_PREFERENCES, minutes)).toEqual({ uncovered: [], none: false })
    }
  })

  it('warns when one trainer has nothing short enough', () => {
    const result = coverage(videos, prefs(['mila-tymchuk']), 10)
    expect(result.none).toBe(true)
    expect(result.uncovered.length).toBeGreaterThan(0)
  })

  it('every trainer alone can fill 20, 30 and 45 minute sessions', () => {
    for (const trainer of trainers) {
      for (const minutes of [20, 30, 45]) {
        expect(coverage(videos, prefs([trainer.id]), minutes).none, `${trainer.id} ${minutes}`).toBe(false)
      }
    }
  })
})

describe('trainerSummary', () => {
  it('summarises categories, count and lengths', () => {
    const tom = trainers.find((t) => t.id === 'tom-merrick')
    expect(trainerSummary(tom, videos)).toEqual({
      categories: ['stretching'],
      count: 8,
      minMinutes: 10,
      maxMinutes: 30,
    })
  })
})
