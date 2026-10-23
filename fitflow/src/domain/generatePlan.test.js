import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { daysBetween } from './dates.js'
import {
  DAY_PATTERNS,
  MAX_SAME_CATEGORY_IN_A_ROW,
  NO_REPEAT_DAYS,
  generatePlan,
  planWeights,
  trainingDates,
} from './generatePlan.js'
import { isWithinTolerance } from './pickVideos.js'
import { allAnswerCombinations } from './quiz.js'
import trainersData from '../data/trainers.json'
import { allowedVideos, coverage } from './preferences.js'

const TODAY = '2026-10-21'
const SEEDS = [1, 2024, 987654321]
const videosById = new Map(catalog.videos.map((video) => [video.id, video]))

const answers = {
  mood: 'okay',
  energy: 'medium',
  goal: 'fitness',
  daysPerWeek: 3,
  sessionMinutes: 20,
  weeks: 2,
}

function sessionMinutes(session) {
  return session.videoIds.reduce(
    (sum, id) => sum + videosById.get(id).durationMin,
    0,
  )
}

// Every rule from US-2 and FR-4; returns a list of broken rules.
function brokenRules(plan, answers) {
  const problems = []
  const { sessions } = plan

  if (plan.startDate !== TODAY) problems.push('does not start today')
  if (daysBetween(plan.startDate, plan.endDate) !== answers.weeks * 7 - 1) {
    problems.push('wrong plan length')
  }
  if (sessions.length !== answers.weeks * answers.daysPerWeek) {
    problems.push('wrong number of sessions')
  }
  for (let week = 0; week < answers.weeks; week++) {
    const inWeek = sessions.filter(
      (s) => Math.floor(daysBetween(TODAY, s.date) / 7) === week,
    )
    if (inWeek.length !== answers.daysPerWeek) {
      problems.push(`week ${week + 1} has ${inWeek.length} sessions`)
    }
  }
  if (new Set(sessions.map((s) => s.date)).size !== sessions.length) {
    problems.push('two sessions on one day')
  }

  for (const [i, session] of sessions.entries()) {
    if (session.videoIds.length === 0) problems.push(`${session.date}: empty`)
    if (!session.videoIds.every((id) => videosById.has(id))) {
      problems.push(`${session.date}: video not in catalog`)
      continue
    }
    if (!isWithinTolerance(sessionMinutes(session), answers.sessionMinutes)) {
      problems.push(
        `${session.date}: ${sessionMinutes(session)} min for a ${answers.sessionMinutes} min target`,
      )
    }
    if (
      !session.videoIds.every(
        (id) => videosById.get(id).category === session.category,
      )
    ) {
      problems.push(`${session.date}: video from another category`)
    }
    const run = sessions.slice(Math.max(0, i - MAX_SAME_CATEGORY_IN_A_ROW), i + 1)
    if (
      run.length > MAX_SAME_CATEGORY_IN_A_ROW &&
      run.every((s) => s.category === session.category)
    ) {
      problems.push(`${session.date}: category repeated too often`)
    }
  }
  return problems
}

// True if some group of 1–3 videos from `pool` fits the target length.
function anyFit(pool, targetMinutes) {
  const n = pool.length
  const fits = (...group) =>
    isWithinTolerance(
      group.reduce((sum, video) => sum + video.durationMin, 0),
      targetMinutes,
    )
  for (let i = 0; i < n; i++) {
    if (fits(pool[i])) return true
    for (let j = i + 1; j < n; j++) {
      if (fits(pool[i], pool[j])) return true
      for (let k = j + 1; k < n; k++) {
        if (fits(pool[i], pool[j], pool[k])) return true
      }
    }
  }
  return false
}

// Sessions that repeat a video from the previous NO_REPEAT_DAYS days even
// though fresh videos of that category could have filled them (US-2).
function avoidableRepeats(plan, answers, videos = catalog.videos) {
  const avoidable = []
  for (const [i, session] of plan.sessions.entries()) {
    const recentIds = new Set(
      plan.sessions
        .slice(0, i)
        .filter((s) => daysBetween(s.date, session.date) < NO_REPEAT_DAYS)
        .flatMap((s) => s.videoIds),
    )
    if (!session.videoIds.some((id) => recentIds.has(id))) continue
    const fresh = videos.filter(
      (video) => video.category === session.category && !recentIds.has(video.id),
    )
    if (anyFit(fresh, answers.sessionMinutes)) avoidable.push(session.date)
  }
  return avoidable
}

describe('trainingDates', () => {
  it('starts today and follows the pattern every week', () => {
    expect(trainingDates(TODAY, 2, 3)).toEqual([
      '2026-10-21',
      '2026-10-23',
      '2026-10-25',
      '2026-10-28',
      '2026-10-30',
      '2026-11-01',
    ])
  })

  it('has a pattern for every days-per-week option', () => {
    for (const [days, pattern] of Object.entries(DAY_PATTERNS)) {
      expect(pattern).toHaveLength(Number(days))
      expect(pattern[0]).toBe(0)
    }
  })
})

describe('generatePlan', () => {
  it('is deterministic for a given seed (FR-3)', () => {
    const plan = () => generatePlan(answers, catalog, { seed: 42, today: TODAY })
    expect(plan()).toEqual(plan())
  })

  it('gives a different plan for a different seed (Regenerate)', () => {
    const a = generatePlan(answers, catalog, { seed: 1, today: TODAY })
    const b = generatePlan(answers, catalog, { seed: 2, today: TODAY })
    expect(a.sessions).not.toEqual(b.sessions)
  })

  it('creates planned sessions with unique ids', () => {
    const plan = generatePlan(answers, catalog, { seed: 5, today: TODAY })
    expect(plan.sessions.every((s) => s.status === 'planned')).toBe(true)
    expect(new Set(plan.sessions.map((s) => s.id)).size).toBe(
      plan.sessions.length,
    )
  })

  it('leans toward calm categories for a stressed, low-energy user', () => {
    const calmAnswers = {
      ...answers,
      mood: 'stressed',
      energy: 'low',
      goal: 'stress',
      daysPerWeek: 6,
      weeks: 4,
    }
    const plan = generatePlan(calmAnswers, catalog, { seed: 3, today: TODAY })
    const gentle = plan.sessions.filter((s) =>
      ['calm', 'yoga', 'stretching'].includes(s.category),
    )
    expect(gentle.length / plan.sessions.length).toBeGreaterThan(0.7)
  })

  it('leans toward active categories for a motivated, high-energy user', () => {
    const activeAnswers = {
      ...answers,
      mood: 'motivated',
      energy: 'high',
      goal: 'strength',
      daysPerWeek: 6,
      weeks: 4,
    }
    const plan = generatePlan(activeAnswers, catalog, { seed: 3, today: TODAY })
    const active = plan.sessions.filter((s) =>
      ['functional', 'cardio'].includes(s.category),
    )
    expect(active.length / plan.sessions.length).toBeGreaterThan(0.6)
  })

  it('follows every US-2 rule for all answer combinations', () => {
    const failures = []
    for (const combination of allAnswerCombinations()) {
      for (const seed of SEEDS) {
        const plan = generatePlan(combination, catalog, { seed, today: TODAY })
        const problems = [
          ...brokenRules(plan, combination),
          ...avoidableRepeats(plan, combination).map(
            (date) => `${date}: avoidable repeat`,
          ),
        ]
        if (problems.length > 0) {
          failures.push({ combination, seed, problems })
        }
      }
    }
    expect(failures.slice(0, 5)).toEqual([])
  }, 60_000)
})

describe('generatePlan with chosen trainers and types (004)', () => {
  const combinations = allAnswerCombinations().filter((_, i) => i % 3 === 0)

  it('every trainer alone gives valid plans from only their videos (FR-4)', () => {
    const failures = []
    for (const trainer of trainersData.trainers) {
      const preferences = { trainers: [trainer.id], categories: ['functional', 'cardio', 'stretching', 'yoga', 'calm'] }
      const videos = allowedVideos(catalog.videos, preferences)
      for (const combination of combinations) {
        const plan = generatePlan(combination, catalog, { seed: 5, today: TODAY, preferences })
        const ids = plan.sessions.flatMap((s) => s.videoIds)
        if (!ids.every((id) => videosById.get(id).trainer === trainer.id)) {
          failures.push(`${trainer.id}: another trainer's video`)
        }
        // A length the trainer can't fill is warned about in the quiz (US-4);
        // every other rule must hold.
        const fillable = !coverage(catalog.videos, preferences, combination.sessionMinutes).none
        // With a single usable workout type, repeats of that type are expected.
        const weights = planWeights(combination, videos, preferences)
        const oneType = Object.values(weights).filter((w) => w > 0).length === 1
        const problems = brokenRules(plan, combination).filter(
          (p) =>
            (fillable || !p.includes(' min for a ')) &&
            !(oneType && p.includes('category repeated too often')),
        )
        if (fillable) {
          problems.push(...avoidableRepeats(plan, combination, videos).map((d) => `${d}: avoidable repeat`))
        }
        if (problems.length > 0) failures.push({ trainer: trainer.id, combination, problems })
      }
    }
    expect(failures.slice(0, 3)).toEqual([])
  }, 120_000)

  it('a yoga-and-stretching choice never gets other types (US-3)', () => {
    const preferences = { trainers: [], categories: ['yoga', 'stretching'] }
    for (const combination of combinations) {
      const plan = generatePlan(combination, catalog, { seed: 9, today: TODAY, preferences })
      for (const session of plan.sessions) {
        expect(['yoga', 'stretching']).toContain(session.category)
      }
    }
  }, 60_000)

  it('a single type allows the same type every day', () => {
    const preferences = { trainers: ['tom-merrick'], categories: ['functional', 'cardio', 'stretching', 'yoga', 'calm'] }
    const plan = generatePlan(
      { mood: 'okay', energy: 'medium', goal: 'fitness', daysPerWeek: 6, sessionMinutes: 20, weeks: 1 },
      catalog,
      { seed: 3, today: TODAY, preferences },
    )
    expect(plan.sessions).toHaveLength(6)
    expect(new Set(plan.sessions.map((s) => s.category))).toEqual(new Set(['stretching']))
  })

  it('leaves out types that cannot fill the chosen length when others can', () => {
    const preferences = { trainers: ['olha-pasichnyk', 'ania-lu'], categories: ['functional', 'cardio', 'stretching', 'yoga', 'calm'] }
    const answers = { mood: 'okay', energy: 'medium', goal: 'stress', daysPerWeek: 6, sessionMinutes: 10, weeks: 2 }
    const { uncovered } = coverage(catalog.videos, preferences, 10)
    const plan = generatePlan(answers, catalog, { seed: 4, today: TODAY, preferences })
    expect(uncovered.length).toBeGreaterThan(0)
    for (const session of plan.sessions) {
      expect(uncovered).not.toContain(session.category)
    }
  })
})
