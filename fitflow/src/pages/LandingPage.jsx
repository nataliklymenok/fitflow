import { Link, Navigate } from 'react-router'
import { CATEGORIES, CATEGORY_LABELS } from '../domain/catalog.js'
import { categoryVars } from '../lib/categoryVars.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'
import styles from './LandingPage.module.css'

const STEPS = [
  {
    title: 'Tell us how you feel',
    text: 'Six quick questions about your mood, energy and goals.',
  },
  {
    title: 'Get your calendar',
    text: 'A plan of workouts matched to you, with rest days built in.',
  },
  {
    title: 'Press play',
    text: 'Follow each session with videos from trusted YouTube trainers.',
  },
]

const CHANNELS = [
  'Yoga With Adriene',
  'MadFit',
  'Heather Robertson',
  'Pamela Reif',
  'Tom Merrick',
]

function LandingPage() {
  const { state } = usePlan()

  // Returning users go straight to their day (spec 002, US-1).
  if (state.plan) return <Navigate to="/today" replace />

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Workouts that match your mood</h1>
        <p className={styles.lead}>
          Answer a few questions and FitFlow builds you a workout calendar from
          free YouTube videos: strength, cardio, stretching, yoga and calm
          sessions, picked for how you feel.
        </p>
        <div className={styles.cta}>
          <Link to="/quiz" className={`${ui.button} ${ui.primary}`}>
            Start the quiz
          </Link>
        </div>
        <ul className={styles.categories} aria-label="Workout types">
          {CATEGORIES.map((category) => (
            <li
              key={category}
              className={ui.chip}
              style={categoryVars(category)}
            >
              {CATEGORY_LABELS[category]}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className={styles.sectionTitle}>
          How it works
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={`${ui.card} ${styles.step}`}>
              <span className={styles.stepNumber} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={ui.muted}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className={`${ui.muted} ${styles.credits}`}>
        Videos by {CHANNELS.join(', ')}. All videos belong to their creators and
        play through YouTube.
      </p>
    </div>
  )
}

export default LandingPage
