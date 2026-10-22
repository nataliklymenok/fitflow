import { Navigate } from 'react-router'
import { usePlan } from '../state/planContext.js'

// Pages that only make sense with a plan send the user to the start otherwise.
function RequirePlan({ children }) {
  const { state } = usePlan()
  if (!state.plan) return <Navigate to="/" replace />
  return children
}

export default RequirePlan
