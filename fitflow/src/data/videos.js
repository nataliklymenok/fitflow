import catalog from './catalog.json'

export const videos = catalog.videos

export const videosById = new Map(videos.map((video) => [video.id, video]))

export function sessionVideos(session) {
  return session.videoIds.map((id) => videosById.get(id)).filter(Boolean)
}

export function sessionMinutes(session) {
  return sessionVideos(session).reduce((sum, video) => sum + video.durationMin, 0)
}
