import { describe, expect, it } from 'vitest'
import { suggestAlternatives } from './suggestions.js'

const videos = [
  { id: 'y10', title: 'Yoga 10', category: 'yoga', durationMin: 10 },
  { id: 'y15', title: 'Yoga 15', category: 'yoga', durationMin: 15 },
  { id: 'y20', title: 'Yoga 20', category: 'yoga', durationMin: 20 },
  { id: 'y22', title: 'Yoga 22', category: 'yoga', durationMin: 22 },
  { id: 'y30', title: 'Yoga 30', category: 'yoga', durationMin: 30 },
  { id: 'c20', title: 'Cardio 20', category: 'cardio', durationMin: 20 },
]

const session = {
  id: 's1',
  date: '2026-10-21',
  category: 'yoga',
  videoIds: ['y20', 'y10'],
  status: 'planned',
}

describe('suggestAlternatives', () => {
  it('suggests same-category videos, closest in length first', () => {
    expect(suggestAlternatives(videos, session, 0).map((v) => v.id)).toEqual([
      'y22',
      'y15',
      'y30',
    ])
  })

  it('never suggests a video already in the session or from another category', () => {
    const ids = suggestAlternatives(videos, session, 1).map((v) => v.id)
    expect(ids).not.toContain('y20')
    expect(ids).not.toContain('y10')
    expect(ids).not.toContain('c20')
  })

  it('respects the limit', () => {
    expect(suggestAlternatives(videos, session, 0, 2)).toHaveLength(2)
  })

  it('returns nothing for an unknown video or index', () => {
    expect(suggestAlternatives(videos, session, 5)).toEqual([])
    expect(
      suggestAlternatives(videos, { ...session, videoIds: ['gone'] }, 0),
    ).toEqual([])
  })
})
