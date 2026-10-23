import { Link, Navigate, useParams } from 'react-router'
import TrainerAvatar from '../components/TrainerAvatar.jsx'
import { LANGUAGE_LABELS, trainersById } from '../data/trainers.js'
import { videos } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { trainerSummary } from '../domain/preferences.js'
import { categoryVars } from '../lib/categoryVars.js'
import ui from '../styles/ui.module.css'
import styles from './TrainerPage.module.css'

// One trainer and their videos in FitFlow, by workout type (spec 004, US-1).
function TrainerPage() {
  const { id } = useParams()
  const trainer = trainersById.get(id)
  if (!trainer) return <Navigate to="/trainers" replace />

  const summary = trainerSummary(trainer, videos)
  const own = videos.filter((video) => video.trainer === trainer.id)

  return (
    <div className={styles.page}>
      <Link to="/trainers" className={styles.back}>
        ← All trainers
      </Link>

      <header className={styles.header}>
        <TrainerAvatar trainer={trainer} size={88} />
        <div className={styles.heading}>
          <h1 className={styles.title}>{trainer.name}</h1>
          <p className={styles.meta}>
            {LANGUAGE_LABELS[trainer.language]} · {summary.count} videos · {summary.minMinutes}–
            {summary.maxMinutes} min
          </p>
          <p className={styles.description}>{trainer.description}</p>
          <a
            href={trainer.url}
            target="_blank"
            rel="noreferrer"
            className={`${ui.button} ${ui.secondary} ${ui.small}`}
          >
            Channel on YouTube ↗
          </a>
        </div>
      </header>

      {summary.categories.map((category) => (
        <section key={category} aria-labelledby={`cat-${category}`} style={categoryVars(category)}>
          <h2 id={`cat-${category}`} className={styles.categoryTitle}>
            {CATEGORY_LABELS[category]}
          </h2>
          <ul className={styles.videos}>
            {own
              .filter((video) => video.category === category)
              .sort((a, b) => a.durationMin - b.durationMin)
              .map((video) => (
                <li key={video.id} className={styles.video}>
                  <span className={styles.minutes}>{video.durationMin}′</span>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.videoTitle}
                  >
                    {video.title}
                  </a>
                  <span className={styles.intensity}>{video.intensity} intensity</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default TrainerPage
