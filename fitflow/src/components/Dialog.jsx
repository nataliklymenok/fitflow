import { useEffect, useId, useRef } from 'react'
import ui from '../styles/ui.module.css'
import styles from './Dialog.module.css'

// A modal built on <dialog>: the browser traps focus and closes it on Esc.
function Dialog({ open, onClose, title, children, actions }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleClick(event) {
    // A click on the backdrop lands on the <dialog> element itself.
    if (event.target === ref.current) onClose()
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className={styles.body}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={`${ui.button} ${ui.ghost} ${ui.small}`}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </dialog>
  )
}

export default Dialog
