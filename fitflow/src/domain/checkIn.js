// The daily mood check-in (spec 003, US-1, US-2).
import { isWithin } from './dates.js'
import { recentVideoIds } from './generatePlan.js'
import { isWithinTolerance, pickVideos } from './pickVideos.js'
import { createRandom, shuffle } from './random.js'

export const MOODS = ['low', 'okay', 'ready']

export const MOOD_LABELS = { low: 'Low', okay: 'Okay', ready: 'Ready' }

// What the user did with today's suggestion.
export const DECISIONS = [null, 'kept', 'adapted']

const DEMANDING = ['functional', 'cardio']
const GENTLE = ['calm', 'stretching']
const GENTLER_CHOICES = ['calm', 'stretching', 'yoga']
const ACTIVE_CHOICES = ['cardio', 'functional']

export function isDemanding(session, videosById) {
  return (
    DEMANDING.includes(session.category) ||
    session.videoIds.some((id) => videosById.get(id)?.intensity === 'high')
  )
}

export function isGentle(session) {
  return GENTLE.includes(session.category)
}

// The same plan and date always give the same seed, so a suggestion does not
// change when the page is reloaded.
export function suggestionSeed(planSeed, date) {
  let hash = planSeed >>> 0
  for (const char of date) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  }
  return hash
}

// Videos for a session of one of `categories`, close to `targetMinutes`.
// Gentle suggestions prefer low-intensity videos, active ones prefer
// medium and high.
function pickSession({
  random,
  videos,
  categories,
  intensities,
  targetMinutes,
  recentIds,
}) {
  const minutesOf = (ids) =>
    ids.reduce(
      (sum, id) => sum + videos.find((v) => v.id === id).durationMin,
      0,
    )

  let fallback = null
  for (const category of shuffle(random, categories)) {
    const inCategory = videos.filter((video) => video.category === category)
    const preferred = inCategory.filter((video) =>
      intensities.includes(video.intensity),
    )
    const videoIds = pickVideos({
      random,
      pools: [preferred, inCategory],
      targetMinutes,
      recentIds,
    })
    if (videoIds.length === 0) continue
    if (isWithinTolerance(minutesOf(videoIds), targetMinutes)) {
      return { category, videoIds }
    }
    fallback ??= { category, videoIds }
  }
  return fallback
}

// What to offer after a check-in, or null:
//   { kind: 'swap', session, replaces } a gentler or more active session for today
//   { kind: 'add', session }            a short session on a rest day
export function suggestFor({ plan, answers, date, mood, videos }) {
  if (!isWithin(date, plan.startDate, plan.endDate)) return null

  const byId = new Map(videos.map((video) => [video.id, video]))
  const today = plan.sessions.find((session) => session.date === date)
  const seed = suggestionSeed(plan.seed, date)
  const random = createRandom(seed)
  const recentIds = recentVideoIds(plan.sessions, date, today?.id)

  if (today) {
    if (today.status !== 'planned') return null
    let choice = null
    if (mood === 'low' && isDemanding(today, byId)) {
      choice = { categories: GENTLER_CHOICES, intensities: ['low'] }
    } else if (mood === 'ready' && isGentle(today)) {
      choice = { categories: ACTIVE_CHOICES, intensities: ['medium', 'high'] }
    }
    if (!choice) return null

    const targetMinutes = today.videoIds.reduce(
      (sum, id) => sum + (byId.get(id)?.durationMin ?? 0),
      0,
    )
    const picked = pickSession({
      random,
      videos,
      targetMinutes,
      recentIds,
      ...choice,
    })
    if (!picked) return null
    return { kind: 'swap', session: { ...today, ...picked }, replaces: today }
  }

  if (mood !== 'ready') return null
  const picked = pickSession({
    random,
    videos,
    categories: ACTIVE_CHOICES,
    intensities: ['medium', 'high'],
    targetMinutes: Math.max(10, Math.round(answers.sessionMinutes / 2)),
    recentIds,
  })
  if (!picked) return null
  return {
    kind: 'add',
    session: {
      id: `s-${date}-${seed.toString(36)}`,
      date,
      status: 'planned',
      ...picked,
    },
  }
}
