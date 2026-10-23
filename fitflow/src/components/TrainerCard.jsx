import { Link } from 'react-router'
import { LANGUAGE_LABELS } from '../data/trainers.js'
import { videos } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { trainerSummary } from '../domain/preferences.js'
import { categoryVars } from '../lib/categoryVars.js'
import ui from '../styles/ui.module.css'
import TrainerPhoto from './TrainerPhoto.jsx'
import styles from './TrainerCard.module.css'

// One trainer on the Trainers page (spec 004, US-1, US-2).
function TrainerCard({ trainer, selected, onToggle }) {
  const summary = trainerSummary(trainer, videos)
  return (
    <li className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <TrainerPhoto trainer={trainer} className={styles.photo} />
      <div className={styles.top}>
        <div className={styles.heading}>
          <h2 className={styles.name}>
            <Link to={`/trainers/${trainer.id}`} className={styles.nameLink}>
              {trainer.name}
            </Link>
          </h2>
          <span className={styles.meta}>
            {LANGUAGE_LABELS[trainer.language]} · {summary.count} videos ·{' '}
            {summary.minMinutes}–{summary.maxMinutes} min
          </span>
        </div>
      </div>
      <p className={styles.description}>{trainer.description}</p>
      <ul className={styles.chips} aria-label={`${trainer.name} teaches`}>
        {summary.categories.map((category) => (
          <li key={category} className={ui.chip} style={categoryVars(category)}>
            {CATEGORY_LABELS[category]}
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${ui.button} ${ui.small} ${selected ? ui.primary : ui.secondary}`}
          aria-pressed={selected}
          onClick={onToggle}
        >
          {selected && <span aria-hidden="true">✓ </span>}
          {selected ? 'Selected' : 'Select'}
          <span className={ui.visuallyHidden}> {trainer.name}</span>
        </button>
        <a
          href={trainer.url}
          target="_blank"
          rel="noreferrer"
          className={`${ui.button} ${ui.ghost} ${ui.small}`}
          aria-label={`${trainer.name} on YouTube (opens in a new tab)`}
        >
          YouTube ↗
        </a>
      </div>
    </li>
  )
}

export default TrainerCard
