import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import catalog from '../data/catalog.json'
import { generatePlan } from './generatePlan.js'
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  THEME_KEY,
  clear,
  isValidState,
  load,
  loadTheme,
  migrate,
  save,
  saveTheme,
} from './storage.js'

const answers = {
  mood: 'tired',
  energy: 'low',
  goal: 'flexibility',
  daysPerWeek: 4,
  sessionMinutes: 30,
  weeks: 2,
}

function makeState() {
  return {
    answers,
    plan: generatePlan(answers, catalog, { seed: 99, today: '2026-10-21' }),
  }
}

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    data,
  }
}

const brokenStorage = {
  getItem() {
    throw new Error('SecurityError')
  },
  setItem() {
    throw new Error('QuotaExceededError')
  },
  removeItem() {
    throw new Error('SecurityError')
  },
}

function stored(value) {
  return memoryStorage({ [STORAGE_KEY]: JSON.stringify(value) })
}

describe('save and load', () => {
  it('round-trips the state, with a schema version (FR-5)', () => {
    const storage = memoryStorage()
    const state = makeState()
    expect(save(state, storage)).toBe(true)
    expect(JSON.parse(storage.data.get(STORAGE_KEY)).version).toBe(
      SCHEMA_VERSION,
    )
    expect(load(storage)).toEqual(state)
  })

  it('keeps edits such as statuses', () => {
    const storage = memoryStorage()
    const state = makeState()
    state.plan.sessions[0] = { ...state.plan.sessions[0], status: 'done' }
    save(state, storage)
    expect(load(storage).plan.sessions[0].status).toBe('done')
  })
})

describe('load returns null instead of crashing (FR-6)', () => {
  it('when nothing is stored', () => {
    expect(load(memoryStorage())).toBeNull()
  })

  it('when the JSON is corrupted', () => {
    expect(load(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toBeNull()
  })

  it('when the version is unknown', () => {
    const { answers, plan } = makeState()
    expect(load(stored({ version: 99, answers, plan }))).toBeNull()
    expect(load(stored({ answers, plan }))).toBeNull()
  })

  it('when the shape is wrong', () => {
    const { plan } = makeState()
    const version = SCHEMA_VERSION
    expect(load(stored({ version, answers: {}, plan }))).toBeNull()
    expect(load(stored({ version, answers, plan: null }))).toBeNull()
    expect(load(stored({ version, answers, plan: { ...plan, sessions: 'x' } }))).toBeNull()
    expect(load(stored(null))).toBeNull()
    expect(load(stored([1, 2, 3]))).toBeNull()
  })

  it('when a session is invalid', () => {
    const { plan } = makeState()
    const badSessions = [
      { ...plan.sessions[0], status: 'maybe' },
      { ...plan.sessions[0], category: 'pilates' },
      { ...plan.sessions[0], date: '2027-01-01' },
      { ...plan.sessions[0], videoIds: [] },
    ]
    for (const session of badSessions) {
      const state = { answers, plan: { ...plan, sessions: [session] } }
      expect(isValidState(state)).toBe(false)
      expect(load(stored({ version: SCHEMA_VERSION, ...state }))).toBeNull()
    }
  })

  it('when storage is unavailable or throws', () => {
    expect(load(null)).toBeNull()
    expect(load(brokenStorage)).toBeNull()
  })
})

describe('save and clear with unavailable storage', () => {
  it('report failure without throwing', () => {
    expect(save(makeState(), null)).toBe(false)
    expect(save(makeState(), brokenStorage)).toBe(false)
    expect(() => clear(brokenStorage)).not.toThrow()
    expect(() => clear(null)).not.toThrow()
  })
})

describe('clear', () => {
  it('removes the saved state', () => {
    const storage = memoryStorage()
    save(makeState(), storage)
    clear(storage)
    expect(load(storage)).toBeNull()
  })
})

describe('migrate', () => {
  it('passes the current version through and rejects others', () => {
    const data = { version: SCHEMA_VERSION, ...makeState() }
    expect(migrate(data)).toBe(data)
    expect(migrate({ version: 0 })).toBeNull()
    expect(migrate(undefined)).toBeNull()
  })
})

describe('theme preference (002 FR-4)', () => {
  it('saves and loads dark or light', () => {
    const storage = memoryStorage()
    expect(loadTheme(storage)).toBeNull()
    expect(saveTheme('light', storage)).toBe(true)
    expect(loadTheme(storage)).toBe('light')
    expect(saveTheme('dark', storage)).toBe(true)
    expect(loadTheme(storage)).toBe('dark')
  })

  it('ignores unknown values', () => {
    const storage = memoryStorage({ [THEME_KEY]: 'sepia' })
    expect(loadTheme(storage)).toBeNull()
    expect(saveTheme('sepia', storage)).toBe(false)
    expect(storage.data.get(THEME_KEY)).toBe('sepia')
  })

  it('survives clear(), which only removes the plan', () => {
    const storage = memoryStorage()
    save(makeState(), storage)
    saveTheme('light', storage)
    clear(storage)
    expect(load(storage)).toBeNull()
    expect(loadTheme(storage)).toBe('light')
  })

  it('works without storage', () => {
    expect(loadTheme(null)).toBeNull()
    expect(loadTheme(brokenStorage)).toBeNull()
    expect(saveTheme('dark', null)).toBe(false)
    expect(saveTheme('dark', brokenStorage)).toBe(false)
  })
})

describe('theme key', () => {
  it('is the same in index.html, which reads it before the app loads', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
    expect(html).toContain(`localStorage.getItem('${THEME_KEY}')`)
  })
})
