import { useEffect, useMemo, useReducer } from 'react'
import { EMPTY_STATE, planReducer } from '../domain/planReducer.js'
import { DEFAULT_PREFERENCES } from '../domain/preferences.js'
import { clear, load, save } from '../domain/storage.js'
import { samePreferences } from './usePreferencesDraft.js'
import { PlanContext } from './planContext.js'

function initialState() {
  return load() ?? EMPTY_STATE
}

function PlanProvider({ children }) {
  const [state, dispatch] = useReducer(planReducer, undefined, initialState)

  // Every change is saved immediately (US-5, US-6).
  useEffect(() => {
    // Save a plan, or a choice of trainers made before the quiz; otherwise
    // there is nothing to keep (spec 004, US-2).
    if (state.plan || !samePreferences(state.preferences, DEFAULT_PREFERENCES)) save(state)
    else clear()
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export default PlanProvider
