// Alternatives for one video in a session (US-4 swap, US-5 edit).

// Videos of the session's category that are not already in the session,
// closest in length to the video being replaced first.
export function suggestAlternatives(videos, session, index, limit = 5) {
  const byId = new Map(videos.map((video) => [video.id, video]))
  const current = byId.get(session.videoIds[index])
  if (!current) return []

  const inSession = new Set(session.videoIds)
  return videos
    .filter(
      (video) => video.category === session.category && !inSession.has(video.id),
    )
    .map((video) => ({
      video,
      distance: Math.abs(video.durationMin - current.durationMin),
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance || a.video.title.localeCompare(b.video.title),
    )
    .slice(0, limit)
    .map(({ video }) => video)
}
