import { useEffect, useRef, useState } from 'react'
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
    navigate('/calendar')
  }

  return (
    <div className={styles.page}>
      <div className={styles.progress}>
        <span className={ui.muted}>
          Question {step + 1} of {QUESTIONS.length}
        </span>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={step + 1}
        >
          <div
            className={styles.fill}
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className={styles.question}>
        {question.title}
      </h1>

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
              {option.label}
            </button>
          )
        })}
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={`${ui.button} ${ui.ghost}`}
          onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
        >
          ← Back
        </button>
        {isLast && (
          <span className={ui.muted}>Your plan is created when you choose.</span>
        )}
      </div>
    </div>
  )
}

export default QuizPage
