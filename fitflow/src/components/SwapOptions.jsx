import ui from '../styles/ui.module.css'
import styles from './SwapOptions.module.css'

// A short list of alternative videos to pick from (US-4, US-5).
function SwapOptions({ options, onChoose, onCancel }) {
  return (
    <div className={styles.swap}>
      <p className={styles.title}>Choose another video</p>
      {options.length === 0 ? (
        <p className={ui.muted}>No other videos in this category.</p>
      ) : (
        <ul className={styles.options}>
          {options.map((option) => (
            <li key={option.id} className={styles.option}>
              <span className={styles.info}>
                <span className={styles.videoTitle}>{option.title}</span>
                <span className={`${ui.muted} ${styles.meta}`}>
                  {option.channel} · {option.durationMin} min
                </span>
              </span>
              <button
                type="button"
                className={`${ui.button} ${ui.secondary} ${ui.small}`}
                onClick={() => onChoose(option)}
                aria-label={`Use ${option.title}`}
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={`${ui.button} ${ui.ghost} ${ui.small}`}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  )
}

export default SwapOptions
