// The plan as an iCalendar (.ics) file (spec 003, US-4, FR-4), following
// RFC 5545: CRLF line endings, escaped text and lines folded at 75 octets.
import { CATEGORY_LABELS } from './catalog.js'
import { addDays } from './dates.js'

const CRLF = '\r\n'
const MAX_OCTETS = 75
const encoder = new TextEncoder()

// TEXT values escape backslashes, semicolons, commas and newlines.
export function escapeText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// Splits a content line into lines of at most 75 octets; each continuation
// starts with a space. Never splits a multi-byte character.
export function foldLine(line) {
  const parts = []
  let current = ''
  let octets = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (octets + size > MAX_OCTETS) {
      parts.push(current)
      current = ' '
      octets = 1
    }
    current += char
    octets += size
  }
  parts.push(current)
  return parts.join(CRLF)
}

const dateValue = (key) => key.replaceAll('-', '')

// 2026-10-22T09:30:05.123Z → 20261022T093005Z
const utcStamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

function eventLines(session, videosById, appUrl, stamp) {
  const videos = session.videoIds.map((id) => videosById.get(id)).filter(Boolean)
  const minutes = videos.reduce((sum, video) => sum + video.durationMin, 0)
  const url = `${appUrl}/session/${session.id}`
  const description = [
    ...videos.map(
      (video) =>
        `${video.title} (${video.channel}, ${video.durationMin} min): https://www.youtube.com/watch?v=${video.id}`,
    ),
    '',
    `Open in FitFlow: ${url}`,
  ].join('\n')

  return [
    'BEGIN:VEVENT',
    `UID:${session.id}@fitflow`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dateValue(session.date)}`,
    `DTEND;VALUE=DATE:${dateValue(addDays(session.date, 1))}`,
    `SUMMARY:${escapeText(`FitFlow · ${CATEGORY_LABELS[session.category]} · ${minutes} min`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ]
}

// One all-day event per session in the plan.
export function buildIcs(plan, videosById, { appUrl, now = new Date() }) {
  const stamp = utcStamp(now)
  const sessions = [...plan.sessions].sort((a, b) => a.date.localeCompare(b.date))
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitFlow//Workout plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FitFlow',
    ...sessions.flatMap((session) => eventLines(session, videosById, appUrl, stamp)),
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join(CRLF) + CRLF
}
