import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import catalog from '../data/catalog.json'
import { todayKey } from '../domain/dates.js'
import { generatePlan } from '../domain/generatePlan.js'
import { QUESTIONS } from '../domain/quiz.js'
import { newSeed } from '../domain/random.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import styles from './QuizPage.module.css'

function QuizPage() {
  const { dispatch } = usePlan()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const headingRef = useRef(null)
  const idPrefix = useId()

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  // Move focus to each new question for keyboard and screen reader users.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function choose(value) {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    if (!isLast) {
      setStep(step + 1)
      return
    }
    const plan = generatePlan(next, catalog, {
      seed: newSeed(),
      today: todayKey(),
    })
    dispatch({ type: 'REPLACE_PLAN', answers: next, plan })
    navigate('/today')
  }

  const remaining = QUESTIONS.length - step - 1

  return (
    <div className={styles.page}>
      <div className={styles.progress}>
        <div className={styles.progressText}>
          <span>
            Question {step + 1} of {QUESTIONS.length}
          </span>
          <span>{remaining === 0 ? 'Last question' : `${remaining} to go`}</span>
        </div>
        <div
          className={styles.segments}
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={step + 1}
        >
          {QUESTIONS.map((q, i) => (
            <span key={q.id} className={`${styles.segment} ${i <= step ? styles.filled : ''}`} />
          ))}
        </div>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className={styles.question}>
        {question.title}
      </h1>

      <div className={styles.options} role="group" aria-label={question.title}>
        {question.options.map((option, i) => {
          const selected = answers[question.id] === option.value
          const labelId = `${idPrefix}-${question.id}-${i}`
          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${selected ? styles.selected : ''}`}
              aria-pressed={selected}
              aria-labelledby={labelId}
              aria-describedby={`${labelId}-hint`}
              onClick={() => choose(option.value)}
            >
              <span id={labelId} className={styles.optionLabel}>
                {option.label}
              </span>
              <span id={`${labelId}-hint`} className={styles.optionHint}>
                {option.hint}
              </span>
            </button>
          )
        })}
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={`${ui.button} ${ui.secondary}`}
          onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
        >
          ← Back
        </button>
        <span className={ui.muted}>
          {isLast ? 'Your plan is created when you choose.' : 'Tap an answer to continue.'}
        </span>
      </div>
    </div>
  )
}

export default QuizPage
