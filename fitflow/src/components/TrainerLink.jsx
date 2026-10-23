import { Link } from 'react-router'
import { trainersById } from '../data/trainers.js'
import styles from './TrainerLink.module.css'

// A video's trainer, linking to their page (spec 004, US-7).
function TrainerLink({ video }) {
  const trainer = trainersById.get(video?.trainer)
  if (!trainer) return video?.channel ?? null
  return (
    <Link to={`/trainers/${trainer.id}`} className={styles.link}>
      {trainer.name}
    </Link>
  )
}

export default TrainerLink
