import { useState } from 'react'
import { useNavigate } from 'react-router'
import catalog from '../data/catalog.json'
import { todayKey } from '../domain/dates.js'
import { generatePlan } from '../domain/generatePlan.js'
import { newSeed } from '../domain/random.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import ConfirmDialog from './ConfirmDialog.jsx'

// Plan-wide actions, each confirmed first (US-2 Regenerate, US-6).
const ACTIONS = {
  regenerate: {
    label: '↻ Regenerate',
    variant: 'secondary',
    title: 'Regenerate your plan?',
    message:
      'You get a new plan from today with the same answers. Your current sessions, edits and progress will be replaced.',
    confirmLabel: 'Regenerate',
  },
  retake: {
    label: 'Retake quiz',
    variant: 'secondary',
    title: 'Retake the quiz?',
    message:
      "You'll get a new plan when you finish. Your current plan, edits and progress will be replaced.",
    confirmLabel: 'Retake quiz',
  },
  reset: {
    label: 'Reset',
    variant: 'ghost',
    title: 'Reset everything?',
    message:
      'This deletes your plan, answers and progress from this browser. You can take the quiz again afterwards.',
    confirmLabel: 'Reset',
    danger: true,
  },
}

// Buttons for the given actions (e.g. ['regenerate', 'retake']).
function PlanActions({ actions, className, buttonClassName = ui.small, onRegenerated }) {
  const { state, dispatch } = usePlan()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(null)

  function confirm() {
    setConfirming(null)
    if (confirming === 'regenerate') {
      const today = todayKey()
      const plan = generatePlan(state.answers, catalog, { seed: newSeed(), today })
      dispatch({ type: 'REPLACE_PLAN', answers: state.answers, plan })
      onRegenerated?.(today)
    } else if (confirming === 'retake') {
      navigate('/quiz')
    } else if (confirming === 'reset') {
      dispatch({ type: 'RESET' })
      navigate('/')
    }
  }

  const { title, message, confirmLabel, danger } = ACTIONS[confirming ?? actions[0]]

  return (
    <div className={className}>
      {actions.map((id) => (
        <button
          key={id}
          type="button"
          className={`${ui.button} ${ui[ACTIONS[id].variant]} ${buttonClassName}`}
          onClick={() => setConfirming(id)}
        >
          {ACTIONS[id].label}
        </button>
      ))}
      <ConfirmDialog
        open={confirming !== null}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        danger={danger}
        onConfirm={confirm}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}

export default PlanActions
