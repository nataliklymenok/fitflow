import { videosById } from '../data/videos.js'
import { buildIcs } from '../domain/ics.js'
import { usePlan } from '../state/planContext.js'
import ui from '../styles/ui.module.css'

// Downloads the plan as an .ics file for any calendar app (spec 003, US-4).
function ExportButton({ className = '' }) {
  const { state } = usePlan()

  function download() {
    const text = buildIcs(state.plan, videosById, { appUrl: window.location.origin })
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'fitflow-plan.ics'
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      className={`${ui.button} ${ui.secondary} ${ui.small} ${className}`}
      onClick={download}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
      </svg>
      Add to calendar
    </button>
  )
}

export default ExportButton
