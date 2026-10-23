import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import ChoiceSummary from '../components/ChoiceSummary.jsx'
import TrainerAvatar from '../components/TrainerAvatar.jsx'
import catalog from '../data/catalog.json'
import { trainers } from '../data/trainers.js'
import { videos } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { todayKey } from '../domain/dates.js'
import { generatePlan } from '../domain/generatePlan.js'
import { DEFAULT_PREFERENCES, coverage } from '../domain/preferences.js'
import { QUESTIONS } from '../domain/quiz.js'
import { newSeed } from '../domain/random.js'
import { usePlan } from '../state/planContext.js'
import { usePreferencesDraft } from '../state/usePreferencesDraft.js'
import ui from '../styles/ui.module.css'
import styles from './QuizPage.module.css'

// The six questions, then a last step to choose trainers (spec 004, US-2).
const TOTAL_STEPS = QUESTIONS.length + 1

function QuizPage() {
  const { state, dispatch } = usePlan()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const draft = usePreferencesDraft(state.preferences ?? DEFAULT_PREFERENCES)
  const headingRef = useRef(null)

  const onTrainersStep = step === QUESTIONS.length
  const question = QUESTIONS[step]

  // Move focus to each new question for keyboard and screen reader users.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function choose(value) {
    setAnswers({ ...answers, [question.id]: value })
    setStep(step + 1)
  }

  function createPlan() {
    const plan = generatePlan(answers, catalog, {
      seed: newSeed(),
      today: todayKey(),
      preferences: draft.value,
    })
    dispatch({ type: 'REPLACE_PLAN', answers, plan, preferences: draft.value })
    navigate('/today')
  }

  const remaining = TOTAL_STEPS - step - 1

  return (
    <div className={styles.page}>
      <div className={styles.progress}>
        <div className={styles.progressText}>
          <span>
            Question {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{remaining === 0 ? 'Last question' : `${remaining} to go`}</span>
        </div>
        <div
          className={styles.segments}
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step + 1}
          style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span key={i} className={`${styles.segment} ${i <= step ? styles.filled : ''}`} />
          ))}
        </div>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className={styles.question}>
        {onTrainersStep ? 'Who do you want to train with?' : question.title}
      </h1>

      {onTrainersStep ? (
        <TrainersStep draft={draft} sessionMinutes={answers.sessionMinutes} />
      ) : (
        <div className={styles.options} role="group" aria-label={question.title}>
          {question.options.map((option) => {
            const selected = answers[question.id] === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.option} ${selected ? styles.selected : ''}`}
                aria-pressed={selected}
                onClick={() => choose(option.value)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHint}>{option.hint}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className={styles.nav}>
        <button
          type="button"
          className={`${ui.button} ${ui.secondary}`}
          onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
        >
          ← Back
        </button>
        {onTrainersStep ? (
          <button
            type="button"
            className={`${ui.button} ${ui.primary}`}
            disabled={
              draft.errors.length > 0 ||
              coverage(videos, draft.value, answers.sessionMinutes).none
            }
            onClick={createPlan}
          >
            Create my plan
          </button>
        ) : (
          <span className={ui.muted}>Tap an answer to continue.</span>
        )}
      </div>
    </div>
  )
}

// Pick up to 5 trainers (or none for any trainer) and the workout types, with
// a warning when the choice can't fill the chosen session length (US-4).
function TrainersStep({ draft, sessionMinutes }) {
  const { uncovered, none } = coverage(videos, draft.value, sessionMinutes)
  let warning = ''
  if (draft.errors.length === 0 && none) {
    warning = `Your choice has no videos that fit ${sessionMinutes}-minute sessions. Add a trainer, or go back and pick another length.`
  } else if (draft.errors.length === 0 && uncovered.length > 0) {
    const types = uncovered.map((c) => CATEGORY_LABELS[c]).join(' and ')
    warning = `${types} won't be in your plan: nothing fits ${sessionMinutes} minutes.`
  }

  return (
    <div className={styles.trainersStep}>
      <p className={ui.muted} style={{ margin: 0 }}>
        Pick up to 5 trainers, or skip to train with any of them.
      </p>
      <ul className={styles.trainerList} aria-label="Trainers">
        {trainers.map((trainer) => {
          const selected = draft.value.trainers.includes(trainer.id)
          return (
            <li key={trainer.id}>
              <button
                type="button"
                className={`${styles.trainer} ${selected ? styles.selected : ''}`}
                aria-pressed={selected}
                onClick={() => draft.toggleTrainer(trainer.id)}
              >
                <TrainerAvatar trainer={trainer} size={36} />
                {trainer.name}
              </button>
            </li>
          )
        })}
      </ul>
      <ChoiceSummary draft={draft} extraMessage={warning} />
    </div>
  )
}

export default QuizPage
