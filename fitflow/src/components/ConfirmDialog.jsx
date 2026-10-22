import ui from '../styles/ui.module.css'
import Dialog from './Dialog.jsx'

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      actions={
        <>
          <button
            type="button"
            className={`${ui.button} ${ui.secondary}`}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${ui.button} ${danger ? ui.danger : ui.primary}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className={ui.muted} style={{ margin: 0 }}>
        {message}
      </p>
    </Dialog>
  )
}

export default ConfirmDialog
