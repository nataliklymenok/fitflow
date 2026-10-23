import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import SessionEditor from '../components/SessionEditor.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import SwapOptions from '../components/SwapOptions.jsx'
import TrainerLink from '../components/TrainerLink.jsx'
import VideoPlayer from '../components/VideoPlayer.jsx'
import { sessionMinutes, videosById } from '../data/videos.js'
import { CATEGORY_LABELS } from '../domain/catalog.js'
import { formatDay } from '../domain/dates.js'
import { suggestAlternatives } from '../domain/suggestions.js'
import { categoryVars } from '../lib/categoryVars.js'
import { usePlan } from '../state/planContext.js'
import { useAllowedVideos } from '../state/useAllowedVideos.js'
import ui from '../styles/ui.module.css'
import styles from './SessionPage.module.css'

function SessionPage() {
  const { id } = useParams()
  const { state, dispatch } = usePlan()
  const { videos } = useAllowedVideos()
  const [current, setCurrent] = useState(0)
  const [swapping, setSwapping] = useState(null)
  const [editing, setEditing] = useState(false)

  const session = state.plan.sessions.find((s) => s.id === id)
  if (!session) return <Navigate to="/calendar" replace />

  const playing = Math.min(current, session.videoIds.length - 1)
  const video = videosById.get(session.videoIds[playing])

  function setStatus(status) {
    dispatch({ type: 'SET_STATUS', id: session.id, status })
  }

  function swap(index, videoId) {
    dispatch({ type: 'SWAP_VIDEO', id: session.id, index, videoId })
    setSwapping(null)
  }

  return (
    <div
      className={styles.page}
      style={categoryVars(session.category)}
    >
      <Link to="/calendar" className={styles.back}>
        ← Back to calendar
      </Link>

      <header className={styles.header}>
        <p className={styles.date}>{formatDay(session.date, 'EEEE · MMMM d')}</p>
        <h1 className={styles.title}>
          {CATEGORY_LABELS[session.category]} · {sessionMinutes(session)} min
        </h1>
        {session.status !== 'planned' && (
          <div className={styles.badges}>
            <StatusBadge status={session.status} />
          </div>
        )}
      </header>

      <div className={styles.layout}>
        <section className={styles.main} aria-label="Player">
          {video ? (
            <VideoPlayer
              key={video.id}
              videoId={video.id}
              title={video.title}
              onEnded={() =>
                playing < session.videoIds.length - 1 && setCurrent(playing + 1)
              }
              onSwap={() => setSwapping(playing)}
            />
          ) : (
            <p className={ui.muted}>This video is no longer in the catalog.</p>
          )}

          <div className={styles.status}>
            {session.status === 'planned' ? (
              <>
                <button
                  type="button"
                  className={`${ui.button} ${ui.primary}`}
                  onClick={() => setStatus('done')}
                >
                  ✓ Mark as done
                </button>
                <button
                  type="button"
                  className={`${ui.button} ${ui.secondary}`}
                  onClick={() => setStatus('skipped')}
                >
                  Skip
                </button>
              </>
            ) : (
              <>
                <span className={styles.statusText}>
                  {session.status === 'done'
                    ? 'Nice work, this session is done.'
                    : 'You skipped this session.'}
                </span>
                <button
                  type="button"
                  className={`${ui.button} ${ui.ghost}`}
                  onClick={() => setStatus('planned')}
                >
                  Undo
                </button>
              </>
            )}
            <button
              type="button"
              className={`${ui.button} ${ui.ghost} ${styles.edit}`}
              onClick={() => setEditing(true)}
            >
              ✎ Edit session
            </button>
          </div>
        </section>

        <section className={styles.side} aria-labelledby="session-videos">
          <h2 id="session-videos" className={styles.sideTitle}>
            In this session
          </h2>
          <ol className={styles.videos}>
            {session.videoIds.map((videoId, index) => {
              const item = videosById.get(videoId)
              const isPlaying = index === playing
              return (
                <li
                  key={`${index}-${videoId}`}
                  className={`${ui.card} ${styles.video} ${isPlaying ? styles.playing : ''}`}
                >
                  <div className={styles.videoInfo}>
                    <span className={styles.videoTitle}>{item?.title ?? 'Unknown video'}</span>
                    <span className={`${ui.muted} ${styles.videoMeta}`}>
                      {item && (
                        <>
                          <TrainerLink video={item} /> · {item.durationMin} min
                        </>
                      )}
                    </span>
                  </div>
                  <div className={styles.videoActions}>
                    {isPlaying ? (
                      <span className={styles.nowPlaying}>Now playing</span>
                    ) : (
                      <button
                        type="button"
                        className={`${ui.button} ${ui.secondary} ${ui.small}`}
                        onClick={() => setCurrent(index)}
                        aria-label={`Play ${item?.title}`}
                      >
                        ▶ Play
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${ui.button} ${ui.ghost} ${ui.small}`}
                      onClick={() => setSwapping(swapping === index ? null : index)}
                      aria-expanded={swapping === index}
                      aria-label={`Swap ${item?.title}`}
                    >
                      ⇄ Swap
                    </button>
                  </div>

                  {swapping === index && (
                    <SwapOptions
                      options={suggestAlternatives(videos, session, index)}
                      onChoose={(option) => swap(index, option.id)}
                      onCancel={() => setSwapping(null)}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      <SessionEditor
        key={`${session.id}-${session.date}-${session.category}`}
        open={editing}
        onClose={() => setEditing(false)}
        session={session}
      />
    </div>
  )
}

export default SessionPage
