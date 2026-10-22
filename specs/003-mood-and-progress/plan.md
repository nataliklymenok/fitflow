# 003 — Daily Mood Check-in and Progress: Implementation Plan

**Status:** Draft · **Spec:** [spec.md](spec.md) · **Created:** 2026-10-22

## Overview

All new decisions are pure functions in `src/domain/`, next to plan generation and tested the same way. The UI adds two cards to Today (check-in, suggestion), two progress tiles, an "Add to calendar" button and small mood marks in the calendar. Saved data gets a new schema version, which exercises the `migrate()` hook planned in 001 for the first time.

```
Today ── CheckIn ──▶ SET_CHECK_IN ──┐
   │                                 ├─▶ planReducer ─▶ storage (schema v2)
   └── Suggestion ── suggestFor() ──▶ ADAPT_TODAY / UNDO_ADAPTATION / KEEP_PLAN
Calendar ── buildIcs(plan) ──▶ .ics download
Today ── streak(), weekProgress()
```

## Data model and migration (FR-1, FR-2)

The state gains one field:

```js
// checkIns: one record per date that has an answer
checkIns: {
  '2026-10-22': {
    mood: 'low' | 'okay' | 'ready',
    decision: null | 'kept' | 'adapted', // what the user did with the suggestion
    previous: Session | null,            // for Undo: the replaced session, or null if one was added
    sessionId: 's-…',                    // the session that was swapped in or added
  },
}
```

Keeping the suggestion outcome in the same record means a reload shows the same thing: no suggestion after "Keep my plan", and "Undo" still available after a swap, all day.

- **Schema version 2:** `{ version: 2, answers, plan, checkIns }`.
- **`migrate()`:** version 1 → `{ ...data, version: 2, checkIns: {} }`; version 2 passes through; anything else is rejected as before (start fresh).
- **Validation:** `isValidState` also checks `checkIns` (keys are date keys, moods are known values, `previous` is a valid session or null).
- **Reducer:** `REPLACE_PLAN` (quiz, Regenerate) keeps `checkIns`; `RESET` clears them (FR-2). New actions below.

## Check-in and suggestion (US-1, US-2)

New module **`domain/checkIn.js`**:

| Function | Does |
|---|---|
| `MOODS` | `['low', 'okay', 'ready']` with labels |
| `isDemanding(session, videosById)` | Functional or Cardio, or any video at high intensity |
| `isGentle(session)` | Calm or Stretching |
| `suggestFor({ plan, answers, date, mood, videos })` | `null`, or `{ kind: 'swap', session, replaces }`, or `{ kind: 'add', session }` |

Rules, straight from the spec:

| Mood | Today | Suggestion |
|---|---|---|
| Low | demanding session | swap to Calm, Stretching or Yoga, low intensity, same length |
| Ready | gentle session | swap to Cardio or Functional, same length |
| Ready | rest day in the plan | add Cardio or Functional, `max(10, sessionMinutes / 2)` minutes |
| anything else | — | none |

Videos come from the existing `pickVideos()` with `candidatePools()`, using the session's own length as the target and the usual 7-day no-repeat list (excluding the session being replaced). The category is a seeded pick among the allowed ones.

**Stable suggestions:** the seed is derived from the plan's seed and the date, so the same day shows the same suggestion after a reload instead of reshuffling.

**Reducer actions:**

| Action | Effect |
|---|---|
| `SET_CHECK_IN { date, mood }` | Saves or changes the mood; changing it clears an unanswered suggestion, but not an applied one |
| `KEEP_PLAN { date }` | `decision: 'kept'` |
| `ADAPT_TODAY { date, session, previous }` | Replaces (swap) or adds the session; stores `previous` and `sessionId`; `decision: 'adapted'` |
| `UNDO_ADAPTATION { date }` | Restores `previous` (swap) or deletes the added session; `decision: null` |

## Streak and this week (US-3)

New module **`domain/progress.js`**:

- `streak(plan, today)`: walk the plan's sessions from today backwards in date order. Today's session counts if done and is ignored if still planned (the day isn't over). Count done sessions until the first one that is skipped, or planned on a past date. Rest days have no session, so they never break it.
- `weekProgress(plan, today, minutesOf)`: sessions and minutes for Monday–Sunday of the current week: `{ done, planned, minutesDone }`.

Limitation, stated in the UI copy: a streak lives in the current plan, so Regenerate or Retake quiz starts it again.

## Calendar export (US-4, FR-4)

New module **`domain/ics.js`** with `buildIcs(plan, videosById, { appUrl, now })` returning the file text:

- `VCALENDAR` with `VERSION:2.0`, `PRODID:-//FitFlow//Workout plan//EN`, `CALSCALE:GREGORIAN`;
- one `VEVENT` per session: `UID:<session id>@fitflow`, `DTSTAMP` (UTC), all-day `DTSTART;VALUE=DATE` and `DTEND;VALUE=DATE` (next day), `SUMMARY:FitFlow · Yoga · 20 min`, `DESCRIPTION` with each video's title and YouTube link, `URL` back to `/session/<id>`;
- RFC 5545 details: CRLF line endings, text escaping (`\\`, `;`, `,`, newlines) and line folding at 75 octets (UTF-8 aware, because of "·" and "–").

The download is a `Blob` with type `text/calendar` and a temporary `<a download="fitflow-plan.ics">`. No library is needed.

## UI

- **`CheckIn`** card on Today: question, three toggle buttons (Low / Okay / Ready) with small mood icons, `aria-pressed` for the selected one, inside a labelled group. Once answered it collapses to "Feeling low today · Change".
- **`Suggestion`** card: why ("You're feeling low, so here's something gentler"), category block, title, minutes, **Swap to this** / **Keep my plan** (or **Add it** / **Rest anyway**). After applying: "Swapped to Calm · Undo".
- **Progress tiles** on Today: **Streak** (days) and **This week** (done/planned and minutes) join the existing tiles.
- **Calendar:** an **Add to calendar** button next to the plan actions; a mood mark (small icon with `aria-label` "Felt low") in week cells and month cells that have a check-in.
- Mood icons are inline SVG in the app's style (no emoji), colored with the theme tokens.

## Testing

- **Unit:**
  - `checkIn.js`: every mood × session type, rest days, outside the plan, same seed gives the same suggestion, length tolerance, no avoidable repeats;
  - `progress.js`: streak across rest days, broken by a skip or a missed day, today pending vs done, empty plan, and the week boundaries;
  - `ics.js`: structure, all-day dates, escaping, folding of long UTF-8 lines, CRLF endings;
  - reducer actions, including undo of both swap and add;
  - storage: a saved **version 1** fixture migrates to version 2 with empty check-ins, and invalid check-ins are rejected.
- **End-to-end** (`e2e/checkin.spec.js`, `e2e/export.spec.js`):
  - Low on a cardio day → Swap → Undo;
  - Ready on a rest day → Add it;
  - Okay → no suggestion;
  - the answer survives a reload;
  - streak and week tiles update after "Mark as done";
  - the `.ics` download parses and contains every session;
  - mood marks appear in the calendar;
  - an app with version 1 data in `localStorage` still opens the plan.
- **Accessibility:** the axe audits gain the check-in, suggestion and applied states, in both themes.
- **Manual:** import the downloaded `.ics` into Google Calendar and Apple Calendar once (FR-4).

## Risks

| Risk | Mitigation |
|---|---|
| Migration bug loses existing users' plans | Fixture-based unit test from real version 1 data, plus an e2e test with version 1 data in storage |
| Suggestion feels random on each reload | Seed from plan seed + date |
| `.ics` rejected by some calendar app | Follow RFC 5545 strictly (CRLF, folding, escaping, all-day `VALUE=DATE`); import by hand into Google and Apple Calendar |
| Streak looks wrong after Regenerate | Counted per plan, and the copy says so |

## Spec traceability

| Spec item | Where |
|---|---|
| US-1 | `CheckIn`, `SET_CHECK_IN` |
| US-2 | `domain/checkIn.js`, `Suggestion`, `ADAPT_TODAY`, `UNDO_ADAPTATION`, `KEEP_PLAN` |
| US-3 | `domain/progress.js`, Today tiles |
| US-4, FR-4 | `domain/ics.js`, calendar button |
| US-5 | mood marks in `WeekView`, `MonthView` |
| FR-1, FR-2 | schema v2, `migrate()`, reducer |
| FR-3 | `checkIn.js`, `progress.js` unit tests |
