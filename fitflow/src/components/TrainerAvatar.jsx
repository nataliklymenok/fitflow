import styles from './TrainerAvatar.module.css'

// Initials on a color picked from the trainer id; no photos are copied.
function hue(id) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function TrainerAvatar({ trainer, size = 56 }) {
  return (
    <span
      className={styles.avatar}
      style={{ '--hue': hue(trainer.id), width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(trainer.name)}
    </span>
  )
}

export default TrainerAvatar
