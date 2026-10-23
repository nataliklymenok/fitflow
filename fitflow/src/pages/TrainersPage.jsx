import { useState } from 'react'
import ChoiceSummary from '../components/ChoiceSummary.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import TrainerCard from '../components/TrainerCard.jsx'
import catalog from '../data/catalog.json'
import { trainers } from '../data/trainers.js'
import { videos } from '../data/videos.js'
import { CATEGORIES, CATEGORY_LABELS } from '../domain/catalog.js'
import { todayKey } from '../domain/dates.js'
import { setPreferences } from '../domain/planReducer.js'
import { DEFAULT_PREFERENCES, trainerSummary } from '../domain/preferences.js'
import { newSeed } from '../domain/random.js'
import { usePlan } from '../state/planContext.js'
import { samePreferences, usePreferencesDraft } from '../state/usePreferencesDraft.js'
import ui from '../styles/ui.module.css'
import styles from './TrainersPage.module.css'

// Browse trainers and choose who the plan comes from (spec 004, US-1, US-2,
// US-5, US-6).
function TrainersPage() {
  const { state, dispatch } = usePlan()
  const saved = state.preferences ?? DEFAULT_PREFERENCES
  const draft = usePreferencesDraft(saved)
  const [filter, setFilter] = useState('all')
  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState('')

  const shown = trainers.filter(
    (trainer) => filter === 'all' || trainerSummary(trainer, videos).categories.includes(filter),
  )
  const changed = !samePreferences(draft.value, saved)

  function apply() {
    setConfirming(false)
    dispatch(setPreferences(state, catalog, draft.value, { today: todayKey(), seed: newSeed() }))
    setStatus(state.plan ? 'Saved. Your plan from today uses your new choice.' : 'Saved. Your next plan will use this choice.')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Trainers</h1>
        <p className={styles.lead}>
          Choose up to 5 trainers your plan comes from, or keep any trainer. Switch off workout
          types you don't want.
        </p>
      </header>

      <section className={styles.choice} aria-label="Your choice">
        <ChoiceSummary draft={draft} extraMessage={status} />
        <button
          type="button"
          className={`${ui.button} ${ui.primary}`}
          disabled={!changed || draft.errors.length > 0}
          onClick={() => (state.plan ? setConfirming(true) : apply())}
        >
          Save my choice
        </button>
      </section>

      <div className={styles.filters} role="group" aria-label="Show trainers who teach">
        {['all', ...CATEGORIES].map((id) => (
          <button
            key={id}
            type="button"
            className={`${styles.filter} ${filter === id ? styles.active : ''}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {id === 'all' ? 'All' : CATEGORY_LABELS[id]}
          </button>
        ))}
      </div>

      <ul className={styles.grid}>
        {shown.map((trainer) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
            selected={draft.value.trainers.includes(trainer.id)}
            onToggle={() => {
              setStatus('')
              draft.toggleTrainer(trainer.id)
            }}
          />
        ))}
      </ul>

      <ConfirmDialog
        open={confirming}
        title="Update your plan?"
        message="Planned sessions from today will be rebuilt with your new choice. Done sessions, your streak and check-ins stay as they are."
        confirmLabel="Update plan"
        onConfirm={apply}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

export default TrainersPage
