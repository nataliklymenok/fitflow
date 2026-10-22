import { createContext, useContext } from 'react'

export const PlanContext = createContext(null)

// Returns { state: { answers, plan }, dispatch }.
export function usePlan() {
  const value = useContext(PlanContext)
  if (!value) throw new Error('usePlan must be used inside <PlanProvider>')
  return value
}
