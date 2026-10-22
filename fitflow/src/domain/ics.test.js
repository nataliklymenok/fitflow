import { describe, expect, it } from 'vitest'
import { buildIcs, escapeText, foldLine } from './ics.js'

const videosById = new Map([
  ['aaaaaaaaaaa', { id: 'aaaaaaaaaaa', title: 'Yoga For Hips, Gently; Part 1', channel: 'Yoga With Adriene', durationMin: 20 }],
  ['bbbbbbbbbbb', { id: 'bbbbbbbbbbb', title: '10 Min Cardio – Sweaty Edition', channel: 'Pamela Reif', durationMin: 10 }],
])

const plan = {
  startDate: '2026-10-29',
  endDate: '2026-11-04',
  seed: 1,
  sessions: [
    { id: 's-2', date: '2026-11-01', category: 'cardio', videoIds: ['bbbbbbbbbbb'], status: 'planned' },
    { id: 's-1', date: '2026-10-31', category: 'yoga', videoIds: ['aaaaaaaaaaa', 'bbbbbbbbbbb'], status: 'done' },
  ],
}

const ics = buildIcs(plan, videosById, {
  appUrl: 'https://fitflow.example',
  now: new Date('2026-10-22T09:30:05.123Z'),
})

// Undo folding, then split into content lines.
const unfolded = ics.replace(/\r\n /g, '').split('\r\n').filter(Boolean)
const value = (name, from = unfolded) => from.find((l) => l.startsWith(name)).slice(name.length)

describe('buildIcs (003 US-4, FR-4)', () => {
  it('is a calendar with one event per session, in date order', () => {
    expect(unfolded[0]).toBe('BEGIN:VCALENDAR')
    expect(unfolded.at(-1)).toBe('END:VCALENDAR')
    expect(unfolded).toContain('VERSION:2.0')
    expect(unfolded.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2)
    expect(unfolded.filter((l) => l.startsWith('UID:'))).toEqual([
      'UID:s-1@fitflow',
      'UID:s-2@fitflow',
    ])
  })

  it('makes all-day events, ending the next day (across a month end)', () => {
    const first = unfolded.slice(unfolded.indexOf('BEGIN:VEVENT'))
    expect(value('DTSTART;VALUE=DATE:', first)).toBe('20261031')
    expect(value('DTEND;VALUE=DATE:', first)).toBe('20261101')
    expect(value('DTSTAMP:')).toBe('20261022T093005Z')
  })

  it('names the event and links the videos and the session', () => {
    expect(value('SUMMARY:')).toBe('FitFlow · Yoga · 30 min')
    const description = value('DESCRIPTION:')
    expect(description).toContain('https://www.youtube.com/watch?v=aaaaaaaaaaa')
    expect(description).toContain('Open in FitFlow: https://fitflow.example/session/s-1')
    expect(value('URL:')).toBe('https://fitflow.example/session/s-1')
  })

  it('escapes commas, semicolons and newlines in text', () => {
    const description = value('DESCRIPTION:')
    expect(description).toContain('Yoga For Hips\\, Gently\\; Part 1')
    expect(description).toContain('\\n')
    expect(description).not.toContain('\n')
  })

  it('uses CRLF only and keeps every line within 75 octets', () => {
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
  })
})

describe('escapeText', () => {
  it('escapes backslashes first', () => {
    expect(escapeText('a\\b,c;d\ne')).toBe('a\\\\b\\,c\\;d\\ne')
  })
})

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:Short')).toBe('SUMMARY:Short')
  })

  it('folds long lines without splitting multi-byte characters', () => {
    const line = `DESCRIPTION:${'Stretch – breathe · '.repeat(12)}`
    const folded = foldLine(line)
    const parts = folded.split('\r\n')
    expect(parts.length).toBeGreaterThan(1)
    for (const [i, part] of parts.entries()) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75)
      if (i > 0) expect(part.startsWith(' ')).toBe(true)
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line)
  })
})
