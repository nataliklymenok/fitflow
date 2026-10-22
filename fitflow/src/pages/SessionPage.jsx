import { Navigate, useParams } from 'react-router'
import { usePlan } from '../state/planContext.js'

function SessionPage() {
  const { id } = useParams()
  const { state } = usePlan()
  const session = state.plan.sessions.find((s) => s.id === id)
  if (!session) return <Navigate to="/calendar" replace />

  return <h1>Session</h1>
}

export default SessionPage
