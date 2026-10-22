import { describe, expect, it } from 'vitest'
import { streak, weekProgress } from './progress.js'

// Sessions on the given dates with the given statuses; 20 minutes each.
function plan(entries) {
  return {
    startDate: '2026-10-12',
    endDate: '2026-11-08',
    seed: 1,
    sessions: entries.map(([date, status], i) => ({
      id: `s${i}`,
      date,
      category: 'yoga',
      videoIds: ['v'],
      status,
    })),
  }
}
const minutesOf = () => 20

describe('streak', () => {
  it('counts done training days in a row, across rest days', () => {
    const p = plan([
      ['2026-10-19', 'done'],
      ['2026-10-21', 'done'], // Tue 20 is a rest day
      ['2026-10-22', 'done'],
    ])
    expect(streak(p, '2026-10-22')).toBe(3)
  })

  it('ignores today while it is still planned', () => {
    const p = plan([
      ['2026-10-20', 'done'],
      ['2026-10-21', 'done'],
      ['2026-10-22', 'planned'],
    ])
    expect(streak(p, '2026-10-22')).toBe(2)
  })

  it('is broken by a skipped session', () => {
    const p = plan([
      ['2026-10-19', 'done'],
      ['2026-10-20', 'skipped'],
      ['2026-10-21', 'done'],
    ])
    expect(streak(p, '2026-10-22')).toBe(1)
  })

  it('is broken by a missed past session (still planned)', () => {
    const p = plan([
      ['2026-10-19', 'done'],
      ['2026-10-20', 'planned'],
      ['2026-10-21', 'done'],
    ])
    expect(streak(p, '2026-10-22')).toBe(1)
  })

  it('is zero when today was skipped', () => {
    const p = plan([
      ['2026-10-21', 'done'],
      ['2026-10-22', 'skipped'],
    ])
    expect(streak(p, '2026-10-22')).toBe(0)
  })

  it('ignores future sessions, and is zero with nothing done', () => {
    const p = plan([
      ['2026-10-22', 'planned'],
      ['2026-10-25', 'done'],
    ])
    expect(streak(p, '2026-10-22')).toBe(0)
    expect(streak(plan([]), '2026-10-22')).toBe(0)
  })
})

describe('weekProgress', () => {
  const p = plan([
    ['2026-10-18', 'done'], // Sunday of the previous week
    ['2026-10-19', 'done'], // Monday
    ['2026-10-21', 'skipped'],
    ['2026-10-23', 'planned'],
    ['2026-10-25', 'done'], // Sunday
    ['2026-10-26', 'done'], // next Monday
  ])

  it('counts Monday to Sunday of the current week', () => {
    expect(weekProgress(p, '2026-10-22', minutesOf)).toEqual({
      done: 2,
      planned: 4,
      minutesDone: 40,
    })
  })

  it('works on the first and last day of the week', () => {
    expect(weekProgress(p, '2026-10-19', minutesOf).planned).toBe(4)
    expect(weekProgress(p, '2026-10-25', minutesOf).planned).toBe(4)
  })

  it('counts only the plan days in a week the plan starts mid-way', () => {
    const late = plan([['2026-10-22', 'done']])
    expect(weekProgress(late, '2026-10-22', minutesOf)).toEqual({
      done: 1,
      planned: 1,
      minutesDone: 20,
    })
  })
})
