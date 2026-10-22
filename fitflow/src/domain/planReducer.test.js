import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { generatePlan } from './generatePlan.js'
import { isWithinTolerance } from './pickVideos.js'
import {
  EMPTY_STATE,
  addSession,
  changeCategory,
  planReducer,
} from './planReducer.js'

const TODAY = '2026-10-21'
const answers = {
  mood: 'okay',
  energy: 'medium',
  goal: 'fitness',
  daysPerWeek: 3,
  sessionMinutes: 20,
  weeks: 1,
}

// Sessions on Oct 21, 23 and 25; plan runs Oct 21–27.
function makeState() {
  return {
    answers,
    plan: generatePlan(answers, catalog, { seed: 11, today: TODAY }),
    checkIns: {},
  }
}

function sessionOn(state, date) {
  return state.plan.sessions.find((session) => session.date === date)
}

function minutes(videoIds) {
  return videoIds.reduce(
    (sum, id) => sum + catalog.videos.find((v) => v.id === id).durationMin,
    0,
  )
}

describe('REPLACE_PLAN and RESET', () => {
  it('replaces the whole state, then clears it', () => {
    const state = makeState()
    const replaced = planReducer(EMPTY_STATE, { type: 'REPLACE_PLAN', ...state })
    expect(replaced).toEqual(state)
    expect(planReducer(replaced, { type: 'RESET' })).toEqual(EMPTY_STATE)
  })

  it('keeps how the user felt but not suggestion outcomes (003 FR-2)', () => {
    const state = makeState()
    state.checkIns = {
      '2026-10-21': {
        mood: 'low',
        decision: 'adapted',
        previous: state.plan.sessions[0],
        sessionId: 'x',
      },
    }
    const fresh = makeState()
    const next = planReducer(state, {
      type: 'REPLACE_PLAN',
      answers: fresh.answers,
      plan: fresh.plan,
    })
    expect(next.checkIns).toEqual({
      '2026-10-21': { mood: 'low', decision: null, previous: null, sessionId: null },
    })
  })

  it('RESET clears check-ins too (003 FR-2)', () => {
    const state = { ...makeState(), checkIns: { '2026-10-21': { mood: 'ok' } } }
    expect(planReducer(state, { type: 'RESET' }).checkIns).toEqual({})
  })

  it('ignores edits when there is no plan', () => {
    expect(planReducer(EMPTY_STATE, { type: 'DELETE_SESSION', id: 'x' })).toBe(
      EMPTY_STATE,
    )
  })
})

describe('MOVE_SESSION', () => {
  it('moves a session to a rest day and keeps sessions sorted', () => {
    const state = makeState()
    const first = sessionOn(state, '2026-10-21')
    const next = planReducer(state, {
      type: 'MOVE_SESSION',
      id: first.id,
      toDate: '2026-10-26',
    })
    expect(sessionOn(next, '2026-10-21')).toBeUndefined()
    expect(sessionOn(next, '2026-10-26').id).toBe(first.id)
    expect(next.plan.sessions.map((s) => s.date)).toEqual([
      '2026-10-23',
      '2026-10-25',
      '2026-10-26',
    ])
  })

  it('swaps two sessions when the target day is taken', () => {
    const state = makeState()
    const a = sessionOn(state, '2026-10-21')
    const b = sessionOn(state, '2026-10-23')
    const next = planReducer(state, {
      type: 'MOVE_SESSION',
      id: a.id,
      toDate: '2026-10-23',
    })
    expect(sessionOn(next, '2026-10-23').id).toBe(a.id)
    expect(sessionOn(next, '2026-10-21').id).toBe(b.id)
  })

  it('ignores moves outside the plan range, to invalid dates or of unknown sessions', () => {
    const state = makeState()
    const id = state.plan.sessions[0].id
    for (const toDate of ['2026-10-20', '2026-10-28', 'tomorrow']) {
      expect(planReducer(state, { type: 'MOVE_SESSION', id, toDate })).toBe(state)
    }
    expect(
      planReducer(state, { type: 'MOVE_SESSION', id: 'nope', toDate: '2026-10-22' }),
    ).toBe(state)
  })
})

describe('SWAP_VIDEO', () => {
  it('replaces one video', () => {
    const state = makeState()
    const session = state.plan.sessions[0]
    const next = planReducer(state, {
      type: 'SWAP_VIDEO',
      id: session.id,
      index: 0,
      videoId: 'new-video',
    })
    expect(next.plan.sessions[0].videoIds[0]).toBe('new-video')
    expect(state.plan.sessions[0].videoIds[0]).not.toBe('new-video')
  })

  it('ignores an index outside the session', () => {
    const state = makeState()
    const id = state.plan.sessions[0].id
    const next = planReducer(state, {
      type: 'SWAP_VIDEO',
      id,
      index: 9,
      videoId: 'x',
    })
    expect(next.plan.sessions[0]).toBe(state.plan.sessions[0])
  })
})

describe('CHANGE_CATEGORY', () => {
  it('sets the category and new videos that fit the session length', () => {
    const state = makeState()
    const session = state.plan.sessions[0]
    const category = session.category === 'calm' ? 'cardio' : 'calm'
    const next = planReducer(
      state,
      changeCategory(state, catalog.videos, { id: session.id, category, seed: 3 }),
    )
    const changed = next.plan.sessions[0]
    expect(changed.category).toBe(category)
    expect(
      changed.videoIds.every(
        (id) => catalog.videos.find((v) => v.id === id).category === category,
      ),
    ).toBe(true)
    expect(isWithinTolerance(minutes(changed.videoIds), 20)).toBe(true)
  })

  it('ignores unknown categories and unknown sessions', () => {
    const state = makeState()
    const id = state.plan.sessions[0].id
    expect(
      planReducer(state, {
        type: 'CHANGE_CATEGORY',
        id,
        category: 'pilates',
        videoIds: ['x'],
      }),
    ).toBe(state)
    expect(
      planReducer(
        state,
        changeCategory(state, catalog.videos, { id: 'nope', category: 'yoga', seed: 1 }),
      ),
    ).toBe(state)
  })
})

describe('DELETE_SESSION', () => {
  it('turns the day into a rest day', () => {
    const state = makeState()
    const id = sessionOn(state, '2026-10-23').id
    const next = planReducer(state, { type: 'DELETE_SESSION', id })
    expect(next.plan.sessions).toHaveLength(2)
    expect(sessionOn(next, '2026-10-23')).toBeUndefined()
  })
})

describe('ADD_SESSION', () => {
  it('adds a planned session with fitting videos on a rest day', () => {
    const state = makeState()
    const next = planReducer(
      state,
      addSession(state, catalog.videos, {
        date: '2026-10-22',
        category: 'yoga',
        seed: 8,
      }),
    )
    const added = sessionOn(next, '2026-10-22')
    expect(added).toMatchObject({ category: 'yoga', status: 'planned' })
    expect(isWithinTolerance(minutes(added.videoIds), 20)).toBe(true)
    expect(next.plan.sessions.map((s) => s.date)).toEqual([
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-25',
    ])
  })

  it('ignores days that already have a session or are outside the plan', () => {
    const state = makeState()
    for (const date of ['2026-10-21', '2026-10-28']) {
      const action = addSession(state, catalog.videos, {
        date,
        category: 'yoga',
        seed: 8,
      })
      expect(planReducer(state, action)).toBe(state)
    }
  })
})

describe('SET_STATUS', () => {
  it('marks a session done or skipped', () => {
    const state = makeState()
    const id = state.plan.sessions[0].id
    const done = planReducer(state, { type: 'SET_STATUS', id, status: 'done' })
    expect(done.plan.sessions[0].status).toBe('done')
    const skipped = planReducer(done, { type: 'SET_STATUS', id, status: 'skipped' })
    expect(skipped.plan.sessions[0].status).toBe('skipped')
  })

  it('ignores unknown statuses', () => {
    const state = makeState()
    const id = state.plan.sessions[0].id
    expect(planReducer(state, { type: 'SET_STATUS', id, status: 'maybe' })).toBe(
      state,
    )
  })
})

it('ignores unknown actions', () => {
  const state = makeState()
  expect(planReducer(state, { type: 'NOPE' })).toBe(state)
})
