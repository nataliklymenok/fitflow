// Everything that picks videos stays within the user's choice (spec 004, US-3).
import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { suggestFor } from './checkIn.js'
import { generatePlan } from './generatePlan.js'
import { addSession, changeCategory } from './planReducer.js'
import { allowedVideos } from './preferences.js'
import { suggestAlternatives } from './suggestions.js'

const ALL = ['functional', 'cardio', 'stretching', 'yoga', 'calm']
const answers = {
  mood: 'okay',
  energy: 'medium',
  goal: 'fitness',
  daysPerWeek: 3,
  sessionMinutes: 20,
  weeks: 1,
}
const TODAY = '2026-10-21'

function stateFor(preferences) {
  const plan = generatePlan(answers, catalog, { seed: 2, today: TODAY, preferences })
  return { answers, plan, checkIns: {}, preferences }
}

const trainerOf = (id) => catalog.videos.find((v) => v.id === id).trainer

describe('picking within the chosen trainers', () => {
  const preferences = { trainers: ['heather-robertson', 'madfit'], categories: ALL }
  const videos = allowedVideos(catalog.videos, preferences)
  const state = stateFor(preferences)
  const session = state.plan.sessions[0]
  const ours = (ids) => ids.every((id) => ['heather-robertson', 'madfit'].includes(trainerOf(id)))

  it('video swap suggestions', () => {
    const options = suggestAlternatives(videos, session, 0)
    expect(options.length).toBeGreaterThan(0)
    expect(ours(options.map((v) => v.id))).toBe(true)
  })

  it('changing a session type', () => {
    const action = changeCategory(state, videos, { id: session.id, category: 'cardio', seed: 3 })
    expect(action.videoIds.length).toBeGreaterThan(0)
    expect(ours(action.videoIds)).toBe(true)
  })

  it('adding a session on a rest day', () => {
    const action = addSession(state, videos, { date: '2026-10-22', category: 'functional', seed: 4 })
    expect(ours(action.session.videoIds)).toBe(true)
  })

  it('daily suggestions', () => {
    const today = { ...session, category: 'cardio' }
    const plan = { ...state.plan, sessions: [today, ...state.plan.sessions.slice(1)] }
    const s = suggestFor({ plan, answers, date: TODAY, mood: 'low', videos })
    // MadFit has gentle stretching and calm videos, so a gentler session exists.
    expect(s.kind).toBe('swap')
    expect(ours(s.session.videoIds)).toBe(true)
  })
})

describe('daily suggestions with nothing gentler available', () => {
  it('suggests nothing rather than another trainer', () => {
    const preferences = { trainers: ['heather-robertson'], categories: ALL }
    const videos = allowedVideos(catalog.videos, preferences)
    const state = stateFor(preferences)
    const today = state.plan.sessions[0]
    const s = suggestFor({ plan: state.plan, answers, date: TODAY, mood: 'low', videos })
    expect(today.category === 'functional' || today.category === 'cardio').toBe(true)
    expect(s).toBeNull()
  })
})
