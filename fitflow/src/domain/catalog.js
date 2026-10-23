// Workout categories and the shape of the video catalog (FR-1, FR-2).

export const CATEGORIES = ['functional', 'cardio', 'stretching', 'yoga', 'calm']

export const CATEGORY_LABELS = {
  functional: 'Functional',
  cardio: 'Cardio',
  stretching: 'Stretching',
  yoga: 'Yoga',
  calm: 'Calm',
}

export const INTENSITIES = ['low', 'medium', 'high']

export const MIN_VIDEOS_PER_CATEGORY = 10
export const MIN_VIDEOS_PER_TRAINER = 8
export const MIN_DURATION = 5
export const MAX_DURATION = 45

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

function validateVideo(video, index) {
  const where = `videos[${index}]${video?.id ? ` (${video.id})` : ''}`
  const errors = []

  if (typeof video?.id !== 'string' || !YOUTUBE_ID_PATTERN.test(video.id)) {
    errors.push(`${where}: id must be an 11-character YouTube video ID`)
  }
  if (typeof video?.title !== 'string' || video.title.trim() === '') {
    errors.push(`${where}: title is required`)
  }
  if (typeof video?.channel !== 'string' || video.channel.trim() === '') {
    errors.push(`${where}: channel is required`)
  }
  if (
    !Number.isInteger(video?.durationMin) ||
    video.durationMin < MIN_DURATION ||
    video.durationMin > MAX_DURATION
  ) {
    errors.push(
      `${where}: durationMin must be a whole number from ${MIN_DURATION} to ${MAX_DURATION}`,
    )
  }
  if (!CATEGORIES.includes(video?.category)) {
    errors.push(`${where}: category must be one of ${CATEGORIES.join(', ')}`)
  }
  if (!INTENSITIES.includes(video?.intensity)) {
    errors.push(`${where}: intensity must be one of ${INTENSITIES.join(', ')}`)
  }
  if (
    !Array.isArray(video?.tags) ||
    !video.tags.every((tag) => typeof tag === 'string')
  ) {
    errors.push(`${where}: tags must be a list of strings`)
  }
  return errors
}

// Returns a list of human-readable problems; an empty list means valid.
// `trainers` is the list from trainers.json (spec 004, FR-1).
export function validateCatalog(catalog, trainers) {
  if (!Array.isArray(catalog?.videos)) return ['catalog.videos must be a list']
  if (!Array.isArray(trainers)) return ['trainers must be a list']

  const errors = catalog.videos.flatMap(validateVideo)

  const byId = new Map(trainers.map((trainer) => [trainer.id, trainer]))
  for (const [index, video] of catalog.videos.entries()) {
    const trainer = byId.get(video.trainer)
    if (!trainer) {
      errors.push(`videos[${index}] (${video.id}): unknown trainer "${video.trainer}"`)
    } else if (trainer.channel !== video.channel) {
      errors.push(
        `videos[${index}] (${video.id}): channel "${video.channel}" is not ${trainer.name}'s channel "${trainer.channel}"`,
      )
    }
  }

  const seen = new Set()
  for (const video of catalog.videos) {
    if (seen.has(video.id)) errors.push(`duplicate video id ${video.id}`)
    seen.add(video.id)
  }

  for (const trainer of trainers) {
    const count = catalog.videos.filter((v) => v.trainer === trainer.id).length
    if (count < MIN_VIDEOS_PER_TRAINER) {
      errors.push(
        `trainer ${trainer.id} has ${count} videos, needs at least ${MIN_VIDEOS_PER_TRAINER}`,
      )
    }
  }

  for (const category of CATEGORIES) {
    const count = catalog.videos.filter((v) => v.category === category).length
    if (count < MIN_VIDEOS_PER_CATEGORY) {
      errors.push(
        `category ${category} has ${count} videos, needs at least ${MIN_VIDEOS_PER_CATEGORY}`,
      )
    }
  }
  return errors
}
