import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysBetween,
  formatDay,
  isKey,
  isWithin,
  monthGridKeys,
  rangeKeys,
  startOfMonthKey,
  startOfWeekKey,
  todayKey,
  weekdayName,
} from './dates.js'

// Kyiv switches from summer to winter time on 2026-10-25.
const originalTz = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Europe/Kyiv'
})
afterAll(() => {
  process.env.TZ = originalTz
})

describe('todayKey', () => {
  it('uses the local date just after midnight', () => {
    expect(todayKey(new Date(2026, 9, 21, 0, 5))).toBe('2026-10-21')
  })

  it('uses the local date just before midnight', () => {
    expect(todayKey(new Date(2026, 9, 21, 23, 55))).toBe('2026-10-21')
  })
})

describe('addDays', () => {
  it('moves across months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('is not affected by the DST change', () => {
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30')
  })
})

describe('daysBetween', () => {
  it('counts calendar days, including across DST', () => {
    expect(daysBetween('2026-10-21', '2026-10-28')).toBe(7)
    expect(daysBetween('2026-10-28', '2026-10-21')).toBe(-7)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
})

describe('rangeKeys', () => {
  it('includes both ends', () => {
    expect(rangeKeys('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
  })

  it('returns one day when start equals end, and none when reversed', () => {
    expect(rangeKeys('2026-10-21', '2026-10-21')).toEqual(['2026-10-21'])
    expect(rangeKeys('2026-10-22', '2026-10-21')).toEqual([])
  })
})

describe('isWithin', () => {
  it('checks an inclusive range', () => {
    expect(isWithin('2026-10-21', '2026-10-21', '2026-10-27')).toBe(true)
    expect(isWithin('2026-10-27', '2026-10-21', '2026-10-27')).toBe(true)
    expect(isWithin('2026-10-28', '2026-10-21', '2026-10-27')).toBe(false)
  })
})

describe('startOfWeekKey', () => {
  it('returns the Monday of the week', () => {
    expect(startOfWeekKey('2026-10-21')).toBe('2026-10-19') // Wednesday
    expect(startOfWeekKey('2026-10-19')).toBe('2026-10-19') // Monday
    expect(startOfWeekKey('2026-10-25')).toBe('2026-10-19') // Sunday
  })
})

describe('isKey', () => {
  it('accepts real dates only', () => {
    expect(isKey('2026-10-21')).toBe(true)
    expect(isKey('2026-02-30')).toBe(false)
    expect(isKey('2026-10-21T00:00:00Z')).toBe(false)
    expect(isKey(20261021)).toBe(false)
  })
})

describe('formatting', () => {
  it('names weekdays and formats days', () => {
    expect(weekdayName('2026-10-21')).toBe('Wed')
    expect(weekdayName('2026-10-21', 'long')).toBe('Wednesday')
    expect(formatDay('2026-10-21')).toBe('Oct 21')
  })
})

describe('months', () => {
  it('finds the first day of the month', () => {
    expect(startOfMonthKey('2026-10-21')).toBe('2026-10-01')
  })

  it('adds months, clamping to the last day', () => {
    expect(addMonths('2026-10-01', 1)).toBe('2026-11-01')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('builds a month grid of whole Monday-to-Sunday weeks', () => {
    const grid = monthGridKeys('2026-10-21')
    expect(grid[0]).toBe('2026-09-28')
    expect(grid.at(-1)).toBe('2026-11-01')
    expect(grid.length % 7).toBe(0)
  })
})
