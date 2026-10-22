# 003 — Daily Mood Check-in and Progress: Acceptance

**Run:** 2026-10-22 · **Build:** production build served by `vite preview` · **Spec:** [spec.md](spec.md)

## Totals

| Suite | Result |
|---|---|
| Unit tests (Vitest) | 152 passed |
| End-to-end (Playwright): Chromium, Firefox and WebKit, each at 1280×900 and 390×844 | 342 passed, 12 skipped by design (desktop-only or phone-only checks) |
| Accessibility (axe-core), both themes, including check-in, suggestion, swapped and calendar-with-mood states | 0 violations |
| Lint, production build | pass |

## User stories

| Criterion | How it is checked | Result |
|---|---|---|
| **US-1** One-tap check-in (Low / Okay / Ready) on training and rest days | `checkin.spec.js` | ✅ |
| **US-1** Collapses after answering, survives a reload, can be changed | `checkin.spec.js` | ✅ |
| **US-1** Optional: the workout can be started without it | `checkin.spec.js` | ✅ |
| **US-2** Low on a demanding day → gentler session of about the same length | unit tests (every mood × session type, across generated plans), `checkin.spec.js` | ✅ |
| **US-2** Ready on a gentle day → more active session | unit tests, `checkin.spec.js` | ✅ |
| **US-2** Ready on a rest day → short session (`max(10, minutes / 2)`); Low/Okay → rest | unit tests, `checkin.spec.js` | ✅ |
| **US-2** Okay or a fitting mood → no suggestion | unit tests, `checkin.spec.js` | ✅ |
| **US-2** Swap / Add can be undone the same day, also after a reload | reducer tests, `checkin.spec.js` | ✅ |
| **US-2** Keep my plan stays dismissed after a reload | `checkin.spec.js` | ✅ |
| **US-2** Same suggestion after a reload; length tolerance; no avoidable repeats | unit tests | ✅ |
| **US-3** Streak across rest days, broken by a skip or a missed day; this week's sessions and minutes | unit tests, `today.spec.js` | ✅ |
| **US-3** Encouraging empty state instead of a zero streak | `today.spec.js` | ✅ |
| **US-4** Add to calendar downloads an `.ics` with one all-day event per session | unit tests, `export.spec.js`; parsed with the Python `icalendar` library | ✅ |
| **US-4** Imports into Google Calendar and Apple Calendar | by hand (T221) | pending |
| **US-5** Mood marks in week and month views, with accessible labels | `checkin.spec.js` | ✅ |

## Requirements

| Requirement | How it is checked | Result |
|---|---|---|
| **FR-1** Check-ins stored with the plan in schema version 2; version 1 data migrates | unit tests with a real version 1 fixture; `persistence.spec.js` opens the app with version 1 data and finds version 2 after a check-in | ✅ |
| **FR-2** New plan keeps moods (not suggestion outcomes); Reset deletes them | reducer tests | ✅ |
| **FR-3** Suggestion and streak logic are pure and unit-tested | `checkIn.test.js`, `progress.test.js` | ✅ |
| **FR-4** `.ics` follows RFC 5545 (CRLF, escaping, folding at 75 octets, all-day dates) | `ics.test.js`, external parser | ✅ |
| Everything from 001 and 002 still holds | all earlier e2e and accessibility tests pass | ✅ |

## Not covered yet

- Import into Google Calendar and Apple Calendar (T221).
- The check-in on a real iPhone (T222).
