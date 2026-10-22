# 003 — Daily Mood Check-in and Progress

**Status:** Approved · **Created:** 2026-10-22 · **Builds on:** [001](../001-workout-planner/spec.md), [002](../002-ui-refresh/spec.md)

## Summary

The quiz captures how someone feels once, but mood changes day to day. FitFlow asks a one-tap question on the Today screen and, when today's planned workout doesn't fit, offers a lighter or harder one instead. Today also shows a streak and this week's progress, and the whole plan can be added to a calendar app.

This picks up the stories deferred from spec 001: US-7 (mood check-in), US-8 (progress summary) and US-9 (calendar export).

## Why

- A plan made on a good day can feel wrong on a tired one, and that is when people skip. Adapting today's session keeps them moving instead.
- A streak and a weekly count give a reason to come back.
- People live in their calendar app; a plan that shows up there gets followed.

## User stories

### P1 — must have

**US-1. Daily check-in**
As a user, I can tell FitFlow how I feel today in one tap, so that today's workout fits.

- Today asks "How do you feel today?" with three answers: **Low**, **Okay**, **Ready**, on training days and on rest days within the plan.
- The question appears once per day. After answering, it collapses to a short line ("Feeling low today · Change") and stays answered after a reload.
- Answering is optional: the workout can be started without it.

**US-2. Adapted suggestion**
As a user, when my mood doesn't fit today's workout, I get a better one to choose instead.

- **Low** with a demanding session (Functional or Cardio, or high intensity) → suggest a gentle session (Calm, Stretching or Yoga at low intensity) of about the same length.
- **Ready** with a gentle session (Calm or Stretching) → suggest an active one (Cardio or Functional) of about the same length.
- **Okay**, or a mood that already fits → no suggestion.
- **Ready** on a rest day → offer to add a short session (half the usual session length, at least 10 minutes) of an active type, with **Add it** and **Rest anyway**. **Low** or **Okay** on a rest day → no suggestion: rest is part of the plan.
- The suggestion shows its type, length and first video, with **Swap to this** and **Keep my plan**.
- **Swap to this** replaces today's session (same date, new type and videos) and **Add it** adds one; both can be undone the same day.
- Suggestions follow the same rules as plan generation: length within tolerance, no video repeated within 7 days when avoidable.

**US-3. Streak and this week**
As a user, I see my streak and this week's progress on Today, so that I want to keep going.

- **Streak:** training days in a row with the session done, counting back from today (or from yesterday, if today's session isn't done yet). Rest days don't break a streak; a skipped or missed training day does.
- **This week** (Monday to Sunday): sessions done out of planned, and minutes trained.
- With no streak yet, an encouraging empty state rather than a zero.

### P2 — should have (in this release)

**US-4. Add to calendar**
As a user, I can download my plan as a calendar file, so that sessions appear in Google Calendar, Apple Calendar or Outlook.

- A button on the calendar page downloads an `.ics` file with one event per planned session: title like "FitFlow · Yoga · 20 min", the video titles and links in the description, and a link back to the session in FitFlow.
- Events are all-day.
- The file reflects the plan at download time; after edits, the user downloads it again.

**US-5. Mood in the calendar**
As a user, I see on each past day how I felt, so that I can spot patterns.

- Days with a check-in show a small mood mark in the week view and the month view, with an accessible label ("Felt low").

## Functional requirements

- **FR-1** Check-ins are stored locally per date (`YYYY-MM-DD` → `low` | `okay` | `ready`), with the plan, in a new schema version; data saved by 001/002 is migrated automatically (the existing `migrate()` hook).
- **FR-2** Retaking the quiz or regenerating keeps past check-ins; Reset deletes them.
- **FR-3** Suggestion and streak logic are pure functions in `src/domain/`, unit-tested like plan generation.
- **FR-4** The `.ics` file follows RFC 5545 and imports cleanly into Google Calendar and Apple Calendar.

## Non-functional requirements

- Everything from 001 and 002 still holds: all existing e2e and accessibility checks pass in both themes, at desktop and phone sizes.
- The check-in is a real form control group: keyboard reachable, with a visible selected state and an accessible name.

## Out of scope

- Changing future days because of today's mood (only today's session can change).
- Mood history charts beyond the calendar marks.
- Reminders or notifications.
- Syncing with a calendar (the file is a one-time export).

## Success criteria

- A user who answers "Low" on a Cardio day can switch to a gentle session in two taps.
- Data from a plan created before 003 still loads after the update, with no check-ins.
- The `.ics` file imports into Google Calendar and Apple Calendar with every session on the right day.

## Decisions

- **Three check-in answers:** Low / Okay / Ready.
- **Rest days get the check-in too;** "Ready" offers a short added session.
- **Streak** counts training days in a row; rest days don't break it, a skipped or missed training day does.
- **P2 is in this release:** calendar export (.ics) and mood marks in the calendar.
