import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { daysBetween, rangeKeys } from './dates.js'
import { generatePlan } from './generatePlan.js'
import { isDemanding, isGentle, suggestFor } from './checkIn.js'
import { isWithinTolerance } from './pickVideos.js'
import { allAnswerCombinations } from './quiz.js'

const videos = catalog.videos
const byId = new Map(videos.map((video) => [video.id, video]))
const answers = { sessionMinutes: 30 }

// Real catalog videos, by category and intensity.
const find = (category, intensity, minutes) =>
  videos.find(
    (v) =>
      v.category === category &&
      v.intensity === intensity &&
      v.durationMin === minutes,
  ).id

const CARDIO_30 = find('cardio', 'high', 30)
const CALM_20 = find('calm', 'low', 20)
const YOGA_LOW_20 = find('yoga', 'low', 20)
const YOGA_HIGH_20 = find('yoga', 'high', 20)
const FUNCTIONAL_30 = find('functional', 'medium', 30)

// Oct 21–27, one session on the 22nd plus whatever `others` adds.
function planWith(today, others = []) {
  return {
    startDate: '2026-10-21',
    endDate: '2026-10-27',
    seed: 42,
    sessions: [
      { id: 'today', date: '2026-10-22', status: 'planned', ...today },
      ...others,
    ],
  }
}

const minutes = (ids) =>
  ids.reduce((sum, id) => sum + byId.get(id).durationMin, 0)

describe('isDemanding and isGentle', () => {
  it('classifies sessions by category and video intensity', () => {
    expect(isDemanding({ category: 'cardio', videoIds: [] }, byId)).toBe(true)
    expect(
      isDemanding({ category: 'yoga', videoIds: [YOGA_HIGH_20] }, byId),
    ).toBe(true)
    expect(
      isDemanding({ category: 'yoga', videoIds: [YOGA_LOW_20] }, byId),
    ).toBe(false)
    expect(isGentle({ category: 'calm' })).toBe(true)
    expect(isGentle({ category: 'yoga' })).toBe(false)
  })
})

describe('suggestFor on a training day (003 US-2)', () => {
  it('offers something gentler, of the same length, when low on a cardio day', () => {
    const plan = planWith({ category: 'cardio', videoIds: [CARDIO_30] })
    const s = suggestFor({
      plan,
      answers,
      date: '2026-10-22',
      mood: 'low',
      videos,
    })
    expect(s.kind).toBe('swap')
    expect(s.replaces.id).toBe('today')
    expect(s.session.id).toBe('today')
    expect(['calm', 'stretching', 'yoga']).toContain(s.session.category)
    expect(
      s.session.videoIds.every(
        (id) => byId.get(id).category === s.session.category,
      ),
    ).toBe(true)
    expect(isWithinTolerance(minutes(s.session.videoIds), 30)).toBe(true)
  })

  it('offers something more active when ready on a calm day', () => {
    const plan = planWith({ category: 'calm', videoIds: [CALM_20] })
    const s = suggestFor({
      plan,
      answers,
      date: '2026-10-22',
      mood: 'ready',
      videos,
    })
    expect(s.kind).toBe('swap')
    expect(['cardio', 'functional']).toContain(s.session.category)
    expect(isWithinTolerance(minutes(s.session.videoIds), 20)).toBe(true)
  })

  it('treats a high-intensity yoga session as demanding', () => {
    const plan = planWith({ category: 'yoga', videoIds: [YOGA_HIGH_20] })
    expect(
      suggestFor({ plan, answers, date: '2026-10-22', mood: 'low', videos })
        .kind,
    ).toBe('swap')
  })

  it('suggests nothing when the mood already fits', () => {
    const cases = [
      [{ category: 'cardio', videoIds: [CARDIO_30] }, 'ready'],
      [{ category: 'cardio', videoIds: [CARDIO_30] }, 'okay'],
      [{ category: 'calm', videoIds: [CALM_20] }, 'low'],
      [{ category: 'calm', videoIds: [CALM_20] }, 'okay'],
      [{ category: 'yoga', videoIds: [YOGA_LOW_20] }, 'low'],
      [{ category: 'yoga', videoIds: [YOGA_LOW_20] }, 'ready'],
      [{ category: 'functional', videoIds: [FUNCTIONAL_30] }, 'ready'],
    ]
    for (const [today, mood] of cases) {
      const plan = planWith(today)
      expect(
        suggestFor({ plan, answers, date: '2026-10-22', mood, videos }),
        `${today.category} ${mood}`,
      ).toBeNull()
    }
  })

  it('suggests nothing once the session is done or skipped', () => {
    const plan = planWith({
      category: 'cardio',
      videoIds: [CARDIO_30],
      status: 'done',
    })
    expect(
      suggestFor({ plan, answers, date: '2026-10-22', mood: 'low', videos }),
    ).toBeNull()
  })

  it('avoids videos used in the 7 days around today', () => {
    const calm = videos.filter((v) => v.category === 'calm').map((v) => v.id)
    const neighbours = calm.slice(0, 6).map((id, i) => ({
      id: `n${i}`,
      date: i < 3 ? '2026-10-21' : '2026-10-24',
      category: 'calm',
      videoIds: [id],
      status: 'planned',
    }))
    const plan = planWith(
      { category: 'cardio', videoIds: [CARDIO_30] },
      neighbours,
    )
    for (let seed = 1; seed < 20; seed++) {
      const s = suggestFor({
        plan: { ...plan, seed },
        answers,
        date: '2026-10-22',
        mood: 'low',
        videos,
      })
      const used = new Set(neighbours.flatMap((n) => n.videoIds))
      expect(s.session.videoIds.some((id) => used.has(id))).toBe(false)
    }
  })
})

describe('suggestFor on a rest day (003 US-2)', () => {
  const plan = planWith({ category: 'yoga', videoIds: [YOGA_LOW_20] })

  it('offers a short active session when ready', () => {
    const s = suggestFor({
      plan,
      answers,
      date: '2026-10-23',
      mood: 'ready',
      videos,
    })
    expect(s.kind).toBe('add')
    expect(s.session).toMatchObject({ date: '2026-10-23', status: 'planned' })
    expect(['cardio', 'functional']).toContain(s.session.category)
    expect(isWithinTolerance(minutes(s.session.videoIds), 15)).toBe(true)
  })

  it('is at least 10 minutes long', () => {
    const s = suggestFor({
      plan,
      answers: { sessionMinutes: 10 },
      date: '2026-10-23',
      mood: 'ready',
      videos,
    })
    expect(isWithinTolerance(minutes(s.session.videoIds), 10)).toBe(true)
  })

  it('lets low and okay days stay rest days', () => {
    for (const mood of ['low', 'okay']) {
      expect(
        suggestFor({ plan, answers, date: '2026-10-23', mood, videos }),
      ).toBeNull()
    }
  })
})

describe('suggestFor in general', () => {
  it('gives the same suggestion for the same plan and date (stable across reloads)', () => {
    const plan = planWith({ category: 'cardio', videoIds: [CARDIO_30] })
    const run = () =>
      suggestFor({ plan, answers, date: '2026-10-22', mood: 'low', videos })
    expect(run()).toEqual(run())
  })

  it('suggests nothing outside the plan', () => {
    const plan = planWith({ category: 'calm', videoIds: [CALM_20] })
    expect(
      suggestFor({ plan, answers, date: '2026-10-30', mood: 'ready', videos }),
    ).toBeNull()
    expect(daysBetween(plan.endDate, '2026-10-30')).toBeGreaterThan(0)
  })
})

describe('suggestFor across generated plans', () => {
  it('always offers the right kind of session, within the length tolerance', () => {
    const problems = []
    // Every 7th answer combination keeps the test fast but varied.
    const combinations = allAnswerCombinations().filter((_, i) => i % 7 === 0)
    for (const combo of combinations) {
      const plan = generatePlan(combo, catalog, {
        seed: 7,
        today: '2026-10-21',
      })
      for (const date of rangeKeys(plan.startDate, plan.endDate)) {
        const today = plan.sessions.find((s) => s.date === date)
        for (const mood of ['low', 'ready']) {
          const s = suggestFor({ plan, answers: combo, date, mood, videos })
          if (!s) continue
          const target =
            s.kind === 'add'
              ? Math.max(10, Math.round(combo.sessionMinutes / 2))
              : minutes(today.videoIds)
          const allowed =
            mood === 'low'
              ? ['calm', 'stretching', 'yoga']
              : ['cardio', 'functional']
          if (!allowed.includes(s.session.category))
            problems.push(`${date} ${mood}: ${s.session.category}`)
          if (!isWithinTolerance(minutes(s.session.videoIds), target)) {
            problems.push(
              `${date} ${mood}: ${minutes(s.session.videoIds)} for ${target}`,
            )
          }
        }
      }
    }
    expect(problems.slice(0, 5)).toEqual([])
  }, 60_000)
})
