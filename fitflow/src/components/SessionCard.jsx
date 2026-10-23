import { Link } from 'react-router'
import { trainersById } from '../data/trainers.js'
import { sessionMinutes, sessionVideos } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { categoryVars } from '../lib/categoryVars.js'
import ui from '../styles/ui.module.css'
import StatusBadge from './StatusBadge.jsx'
import styles from './SessionCard.module.css'

function SessionCard({ session }) {
  const videos = sessionVideos(session)
  const more = videos.length - 1

  return (
    <Link
      to={`/session/${session.id}`}
      className={`${styles.card} ${styles[session.status]}`}
      style={categoryVars(session.category)}
    >
      <span className={styles.top}>
        <span className={ui.chip}>{CATEGORY_LABELS[session.category]}</span>
        <StatusBadge status={session.status} />
      </span>
      <span className={styles.title}>{videos[0]?.title}</span>
      <span className={styles.meta}>
        {sessionMinutes(session)} min
        {videos[0] && ` · ${trainersById.get(videos[0].trainer)?.name ?? videos[0].channel}`}
        {more > 0 && ` · ${more + 1} videos`}
      </span>
    </Link>
  )
}

export default SessionCard
