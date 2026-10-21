// Calendar dates as local "YYYY-MM-DD" strings ("day keys").
// Keys compare correctly as plain strings and never shift with the time zone.
import {
  addDays as addDaysToDate,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
  startOfWeek,
} from 'date-fns'

const KEY_FORMAT = 'yyyy-MM-dd'
const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function toKey(date) {
  return format(date, KEY_FORMAT)
}

export function fromKey(key) {
  return parse(key, KEY_FORMAT, new Date())
}

export function isKey(value) {
  if (typeof value !== 'string' || !KEY_PATTERN.test(value)) return false
  const date = fromKey(value)
  return isValid(date) && toKey(date) === value
}

export function todayKey(now = new Date()) {
  return toKey(now)
}

export function addDays(key, days) {
  return toKey(addDaysToDate(fromKey(key), days))
}

// Number of calendar days from `from` to `to` (negative if `to` is earlier).
export function daysBetween(from, to) {
  return differenceInCalendarDays(fromKey(to), fromKey(from))
}

// All keys from `start` to `end`, both included.
export function rangeKeys(start, end) {
  const length = daysBetween(start, end) + 1
  return Array.from({ length: Math.max(length, 0) }, (_, i) =>
    addDays(start, i),
  )
}

export function isWithin(key, start, end) {
  return key >= start && key <= end
}

// Weeks start on Monday.
export function startOfWeekKey(key) {
  return toKey(startOfWeek(fromKey(key), { weekStartsOn: 1 }))
}

export function weekdayName(key, style = 'short') {
  return format(fromKey(key), style === 'long' ? 'EEEE' : 'EEE')
}

export function formatDay(key, pattern = 'MMM d') {
  return format(fromKey(key), pattern)
}
