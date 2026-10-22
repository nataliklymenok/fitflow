import { describe, expect, it } from 'vitest'
import { planProgress, todayStatus } from './today.js'

// Oct 21–27; sessions Wed 21 (done), Fri 23, Sun 25 (skipped), Mon 26.
function makePlan() {
  return {
    startDate: '2026-10-21',
    endDate: '2026-10-27',
    seed: 1,
    sessions: [
      { id: 'a', date: '2026-10-21', category: 'yoga', videoIds: ['x'], status: 'done' },
      { id: 'b', date: '2026-10-23', category: 'cardio', videoIds: ['y'], status: 'planned' },
      { id: 'c', date: '2026-10-25', category: 'calm', videoIds: ['z'], status: 'skipped' },
      { id: 'd', date: '2026-10-26', category: 'yoga', videoIds: ['w'], status: 'planned' },
    ],
  }
}

describe('todayStatus', () => {
  it('shows the session planned for today, whatever its status', () => {
    expect(todayStatus(makePlan(), '2026-10-23')).toEqual({
      kind: 'training',
      session: makePlan().sessions[1],
    })
    expect(todayStatus(makePlan(), '2026-10-21').session.id).toBe('a')
  })

  it('on a rest day, points to the next planned session', () => {
    expect(todayStatus(makePlan(), '2026-10-22')).toEqual({
      kind: 'rest',
      next: makePlan().sessions[1],
    })
  })

  it('skips sessions that are no longer planned when looking ahead', () => {
    const plan = makePlan()
    plan.sessions[3].status = 'done'
    expect(todayStatus(plan, '2026-10-24')).toEqual({ kind: 'rest', next: null })
  })

  it('on the last rest day with nothing left, has no next session', () => {
    expect(todayStatus(makePlan(), '2026-10-27')).toEqual({ kind: 'rest', next: null })
  })

  it('before the plan starts, points to its first session', () => {
    expect(todayStatus(makePlan(), '2026-10-19')).toEqual({
      kind: 'upcoming',
      next: makePlan().sessions[1],
    })
  })

  it('after the last day, the plan is finished', () => {
    expect(todayStatus(makePlan(), '2026-10-28')).toEqual({ kind: 'finished' })
  })
})

describe('planProgress', () => {
  const minutesOf = (session) => ({ a: 22, b: 30, c: 15, d: 20 })[session.id]

  it('counts done sessions and their minutes only (FR-1)', () => {
    expect(planProgress(makePlan(), minutesOf)).toEqual({
      done: 1,
      total: 4,
      minutesDone: 22,
      fraction: 0.25,
    })
  })

  it('handles all done and nothing done', () => {
    const plan = makePlan()
    plan.sessions.forEach((s) => (s.status = 'done'))
    expect(planProgress(plan, minutesOf)).toMatchObject({ done: 4, minutesDone: 87, fraction: 1 })
    plan.sessions.forEach((s) => (s.status = 'planned'))
    expect(planProgress(plan, minutesOf)).toMatchObject({ done: 0, minutesDone: 0, fraction: 0 })
  })

  it('handles a plan without sessions', () => {
    expect(planProgress({ ...makePlan(), sessions: [] }, minutesOf)).toEqual({
      done: 0,
      total: 0,
      minutesDone: 0,
      fraction: 0,
    })
  })
})
