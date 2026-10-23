import { useState } from 'react'
import { Link } from 'react-router'
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
  const [justSaved, setJustSaved] = useState(false)

  const shown = trainers.filter(
    (trainer) => filter === 'all' || trainerSummary(trainer, videos).categories.includes(filter),
  )
  const changed = !samePreferences(draft.value, saved)

  function apply() {
    setConfirming(false)
    dispatch(setPreferences(state, catalog, draft.value, { today: todayKey(), seed: newSeed() }))
    setStatus(
      state.plan
        ? 'Saved. Your plan is updated: sessions from today use your new choice.'
        : 'Saved. Your next plan will use this choice.',
    )
    setJustSaved(true)
  }

  // Any new edit makes the choice unsaved again.
  function edited(change) {
    setStatus('')
    setJustSaved(false)
    change()
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
        <ChoiceSummary
          draft={{
            ...draft,
            toggleCategory: (c) => edited(() => draft.toggleCategory(c)),
          }}
          extraMessage={status}
          showClear={false}
        />
        <div className={styles.saveColumn}>
          {draft.value.trainers.length > 0 && (
            <button
              type="button"
              className={`${ui.button} ${ui.ghost} ${ui.small}`}
              onClick={() => edited(draft.clearTrainers)}
            >
              Clear
            </button>
          )}
          {justSaved ? (
            <>
              <button type="button" className={`${ui.button} ${ui.secondary}`} disabled>
                ✓ Saved
              </button>
              <Link to={state.plan ? '/today' : '/quiz'} className={styles.next}>
                {state.plan ? 'Open Today →' : 'Take the quiz →'}
              </Link>
            </>
          ) : (
            <button
              type="button"
              className={`${ui.button} ${ui.primary}`}
              disabled={!changed || draft.errors.length > 0}
              onClick={() => (state.plan ? setConfirming(true) : apply())}
            >
              Save my choice
            </button>
          )}
        </div>
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
            onToggle={() => edited(() => draft.toggleTrainer(trainer.id))}
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
