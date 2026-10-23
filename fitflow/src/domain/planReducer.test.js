import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { generatePlan } from './generatePlan.js'
import { DEFAULT_PREFERENCES } from './preferences.js'
import { isWithinTolerance } from './pickVideos.js'
import {
  EMPTY_STATE,
  addSession,
  changeCategory,
  planReducer,
  setPreferences,
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
    preferences: DEFAULT_PREFERENCES,
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

describe('daily check-in actions (003 US-1, US-2)', () => {
  const checkIn = (state, mood, date = TODAY) =>
    planReducer(state, { type: 'SET_CHECK_IN', date, mood })

  it('SET_CHECK_IN saves and changes the mood', () => {
    const state = checkIn(makeState(), 'low')
    expect(state.checkIns[TODAY]).toEqual({
      mood: 'low',
      decision: null,
      previous: null,
      sessionId: null,
    })
    expect(checkIn(state, 'okay').checkIns[TODAY].mood).toBe('okay')
  })

  it('SET_CHECK_IN ignores unknown moods and days outside the plan', () => {
    const state = makeState()
    expect(checkIn(state, 'sleepy')).toBe(state)
    expect(checkIn(state, 'low', '2026-11-30')).toBe(state)
  })

  it('KEEP_PLAN dismisses the suggestion, and a new mood brings it back', () => {
    let state = checkIn(makeState(), 'low')
    state = planReducer(state, { type: 'KEEP_PLAN', date: TODAY })
    expect(state.checkIns[TODAY].decision).toBe('kept')
    expect(checkIn(state, 'ready').checkIns[TODAY].decision).toBeNull()
  })

  it('ADAPT_TODAY swaps the session and UNDO_ADAPTATION restores it', () => {
    let state = checkIn(makeState(), 'low')
    const previous = sessionOn(state, TODAY)
    const session = { ...previous, category: 'calm', videoIds: ['calm-video'] }
    state = planReducer(state, { type: 'ADAPT_TODAY', date: TODAY, session, previous })
    expect(sessionOn(state, TODAY)).toEqual(session)
    expect(state.checkIns[TODAY]).toMatchObject({
      decision: 'adapted',
      previous,
      sessionId: previous.id,
    })

    // Changing the mood afterwards keeps the swap, so it can still be undone.
    state = checkIn(state, 'okay')
    expect(state.checkIns[TODAY].decision).toBe('adapted')

    state = planReducer(state, { type: 'UNDO_ADAPTATION', date: TODAY })
    expect(sessionOn(state, TODAY)).toEqual(previous)
    expect(state.checkIns[TODAY]).toEqual({
      mood: 'okay',
      decision: null,
      previous: null,
      sessionId: null,
    })
  })

  it('ADAPT_TODAY adds a session on a rest day and UNDO_ADAPTATION removes it', () => {
    const restDay = '2026-10-22'
    let state = checkIn(makeState(), 'ready', restDay)
    const session = {
      id: 'added',
      date: restDay,
      category: 'cardio',
      videoIds: ['v'],
      status: 'planned',
    }
    state = planReducer(state, { type: 'ADAPT_TODAY', date: restDay, session, previous: null })
    expect(sessionOn(state, restDay).id).toBe('added')
    expect(state.plan.sessions.map((s) => s.date)).toEqual([
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-25',
    ])

    state = planReducer(state, { type: 'UNDO_ADAPTATION', date: restDay })
    expect(sessionOn(state, restDay)).toBeUndefined()
  })

  it('ADAPT_TODAY needs an unanswered check-in and a matching day', () => {
    const state = makeState()
    const previous = sessionOn(state, TODAY)
    const session = { ...previous, category: 'calm' }
    const adapt = (s, extra = {}) =>
      planReducer(s, { type: 'ADAPT_TODAY', date: TODAY, session, previous, ...extra })

    expect(adapt(state)).toBe(state) // no check-in yet
    const kept = planReducer(checkIn(state, 'low'), { type: 'KEEP_PLAN', date: TODAY })
    expect(adapt(kept)).toBe(kept) // already decided
    const answered = checkIn(state, 'low')
    expect(adapt(answered, { session: { ...session, date: '2026-10-23' } })).toBe(answered)
    // Adding on a day that already has a session is refused.
    expect(adapt(answered, { previous: null })).toBe(answered)
  })

  it('UNDO_ADAPTATION does nothing without an applied suggestion', () => {
    const state = checkIn(makeState(), 'low')
    expect(planReducer(state, { type: 'UNDO_ADAPTATION', date: TODAY })).toBe(state)
  })
})

describe('changing trainers and types (004 US-5)', () => {
  const madfitCardio = { trainers: ['madfit'], categories: ['cardio'] }

  it('saves the choice when there is no plan yet', () => {
    const next = planReducer(EMPTY_STATE, setPreferences(EMPTY_STATE, catalog, madfitCardio, { today: TODAY, seed: 1 }))
    expect(next.preferences).toEqual(madfitCardio)
    expect(next.plan).toBeNull()
  })

  it('rebuilds planned sessions from today, keeping done and earlier ones', () => {
    let state = makeState() // sessions on Oct 21, 23 and 25
    state = planReducer(state, { type: 'SET_STATUS', id: sessionOn(state, TODAY).id, status: 'done' })
    const done = sessionOn(state, TODAY)
    const tomorrowish = '2026-10-23'
    const next = planReducer(
      state,
      setPreferences(state, catalog, madfitCardio, { today: tomorrowish, seed: 7 }),
    )
    expect(sessionOn(next, TODAY)).toEqual(done)
    expect(next.plan.sessions.map((s) => s.date)).toEqual(state.plan.sessions.map((s) => s.date))
    for (const session of next.plan.sessions.filter((s) => s.date >= tomorrowish)) {
      expect(session.category).toBe('cardio')
      expect(session.videoIds.every((id) => catalog.videos.find((v) => v.id === id).trainer === 'madfit')).toBe(true)
    }
  })

  it('also rebuilds today when it is still planned, and clears an applied suggestion', () => {
    let state = planReducer(makeState(), { type: 'SET_CHECK_IN', date: TODAY, mood: 'low' })
    const previous = sessionOn(state, TODAY)
    state = planReducer(state, {
      type: 'ADAPT_TODAY',
      date: TODAY,
      session: { ...previous, category: 'calm' },
      previous,
    })
    const next = planReducer(state, setPreferences(state, catalog, madfitCardio, { today: TODAY, seed: 7 }))
    expect(sessionOn(next, TODAY).category).toBe('cardio')
    expect(next.checkIns[TODAY]).toEqual({ mood: 'low', decision: null, previous: null, sessionId: null })
  })

  it('a new plan from the quiz carries its preferences', () => {
    const state = makeState()
    const next = planReducer(state, {
      type: 'REPLACE_PLAN',
      answers: state.answers,
      plan: state.plan,
      preferences: madfitCardio,
    })
    expect(next.preferences).toEqual(madfitCardio)
    expect(planReducer(next, { type: 'RESET' }).preferences).toEqual(DEFAULT_PREFERENCES)
  })
})

