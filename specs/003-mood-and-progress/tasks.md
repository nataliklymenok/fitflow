# 003 — Daily Mood Check-in and Progress: Tasks

**Status:** Done · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Created:** 2026-10-22

Tasks run in order, numbered from T201 so commit messages never clash with earlier specs. A task is done when its **Done when** check passes; each ends with a commit naming the task ID.

Legend: `[ ]` to do · `[x]` done · **Checkpoint** = stop and review together.

Unless a task says otherwise, every task also requires: `npm test`, `npm run lint`, `npm run build` and the existing e2e suite (`caffeinate -i npm run test:e2e`) pass.

## Phase 1 — Domain logic (pure JS, tested)

- [x] **T201** Schema version 2: `checkIns` in state and storage; `migrate()` upgrades version 1; `isValidState` checks check-ins; `REPLACE_PLAN` keeps them, `RESET` clears them. *(FR-1, FR-2)*
  Done when: a version 1 fixture (real saved data from 001/002) loads as version 2 with empty check-ins; invalid check-ins are rejected; reducer tests cover keep and clear.
- [x] **T202** `domain/progress.js`: `streak(plan, today)` and `weekProgress(plan, today, minutesOf)`. Tests: streak over rest days, broken by a skip and by a missed past day, today pending vs done, empty plan, week boundaries (Monday, Sunday, plan starting mid-week). *(US-3)*
- [x] **T203** `domain/checkIn.js`: `MOODS`, `isDemanding`, `isGentle`, `suggestFor()`. Tests: every mood × session type, rest day add (length `max(10, minutes / 2)`), no suggestion outside the plan, same date and plan seed give the same suggestion, length within tolerance, no avoidable repeats. *(US-2, FR-3)*
- [x] **T204** Reducer actions `SET_CHECK_IN`, `KEEP_PLAN`, `ADAPT_TODAY`, `UNDO_ADAPTATION`, one test group each, including undo of a swap and of an added session. *(US-1, US-2)*
- [x] **T205** `domain/ics.js`: `buildIcs()`. Tests: calendar and event structure, all-day dates, UID and URL, escaping, folding of long lines with multi-byte characters, CRLF endings. *(US-4, FR-4)*

## Phase 2 — Screens

- [x] **T210** Mood icons (inline SVG) and the `CheckIn` card on Today: three toggle buttons in a labelled group, collapsed summary with **Change** once answered. *(US-1)*
  Done when: e2e checks the answer survives a reload and can be changed; the card shows on training and rest days.
- [x] **T211** `Suggestion` card: swap (Low on a demanding day, Ready on a gentle day), add (Ready on a rest day), **Keep my plan** / **Rest anyway**, applied state with **Undo**. *(US-2)*
  Done when: e2e covers Low → Swap → Undo, Ready on a rest day → Add it, Okay → no suggestion, and Keep my plan staying dismissed after a reload.
- [x] **T212** Today tiles: **Streak** and **This week** (sessions and minutes), with an encouraging empty state. *(US-3)*
  Done when: e2e checks both tiles change after marking a session done.
- [x] **T213** **Add to calendar** button on the calendar page that downloads `fitflow-plan.ics`. *(US-4)*
  Done when: e2e captures the download and finds one event per session with the right dates.
- [x] **T214** Mood marks in week and month views, with accessible labels ("Felt low"). *(US-5)*

**Checkpoint A:** review the check-in, suggestion, progress tiles, export and mood marks in both themes, desktop and phone.

## Phase 3 — Release

- [x] **T220** Verification: accessibility audits for the new states (unanswered, answered, suggestion, applied) in both themes; e2e with version 1 data in storage; full unit and e2e run. Record results in `specs/003-mood-and-progress/acceptance.md`.
- [x] **T221** Update the README ("What it does", screenshots, the 003 docs in the SDD table, test counts).
- [x] **T222** Push to `main`, run the e2e suite against the live site, and ask the user to check the check-in on their iPhone and to import the downloaded `.ics` into Apple Calendar (and Google Calendar).
  Done when: live run is green and the user has checked it.
