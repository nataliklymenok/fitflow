import styles from './StatusBadge.module.css'

const LABELS = { done: '✓ Done', skipped: 'Skipped' }

function StatusBadge({ status }) {
  if (!LABELS[status]) return null
  return <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>
}

export default StatusBadge
