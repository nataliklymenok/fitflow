# 001 — Mood-based Workout Planner

**Status:** Approved · **Created:** 2026-10-21 · **Approved:** 2026-10-21

## Summary

A visitor answers a short quiz about their mood, energy and goals. FitFlow builds a personal workout calendar from curated YouTube videos across five training styles. The visitor can follow the plan, watch each workout in the app, mark sessions done and edit the schedule.

## Problem

Free workout videos are everywhere, but choosing one every day takes effort, and people skip training when they feel tired or stressed. FitFlow makes that choice for them, matched to how they feel, and spreads it across a plan they can follow.

## Users

- **Primary:** someone who works out at home with YouTube and wants structure without paying for an app.
- **Secondary (portfolio):** an interviewer who opens the link and should be able to get through the whole flow in under 2 minutes.

## Workout categories

| Category | Examples of content |
|---|---|
| Functional / strength | full-body, bodyweight, dumbbell |
| Cardio | HIIT, dance cardio, low-impact cardio |
| Stretching / mobility | full-body stretch, mobility flows |
| Yoga | vinyasa, beginner yoga |
| Calm / recovery | yin yoga, breathing, wind-down routines |

Videos come from 5 YouTube channels:

| Channel | Main categories |
|---|---|
| Yoga With Adriene | Yoga, Calm / recovery |
| MadFit | Functional, Cardio |
| Heather Robertson | Functional, Cardio |
| Pamela Reif | Cardio, Stretching |
| Tom Merrick | Stretching / mobility |

Only videos that allow embedding are included. If a category runs short of videos, a video from another channel may be added, recorded in the catalog.

## User stories

### P1 — must have (MVP)

**US-1. Take the quiz**
As a visitor, I answer a few quick questions using buttons, so that FitFlow knows what kind of plan suits me.

- Given I open the site for the first time, when the landing page loads, then I see a clear call to action to start the quiz.
- Given I'm in the quiz, each question is one screen with tap-to-select options, with a progress indicator and a Back button.
- Given I finish the last question, then a plan is generated and I land on my calendar.
- The quiz has at most 6 questions and takes under 60 seconds.

**US-2. Get a generated plan**
As a visitor, I get a workout schedule matched to my answers, so that I don't have to choose videos myself.

- The plan starts today and covers the chosen length (e.g. 1, 2 or 4 weeks), with sessions only on the chosen number of days per week; all other days are rest days.
- Each session has 1 or more videos whose total length is close to my chosen session length (within ±5 minutes or ±25%, whichever is larger).
- The mix of categories reflects my answers. For example, low energy or stress leans toward Calm and Stretching; high energy and a fitness goal lean toward Cardio and Functional.
- The same video is not repeated within 7 days if the catalog has an alternative.
- Answering the same quiz the same way can give a different (but still valid) plan when I click **Regenerate**.

**US-3. See my calendar**
As a user, I see my plan as a calendar, so that I know what to do each day.

- Week view by default, with a month view available.
- Each day shows its session: category, title, total duration and status (planned / done / skipped), or "Rest".
- Today is clearly highlighted.

**US-4. Do a workout**
As a user, I open a session and play its videos inside FitFlow, so that I don't get lost on YouTube.

- The session view shows an embedded YouTube player, the video title, channel and duration.
- I can mark the session **Done** or **Skipped**.
- If a video is unavailable, I can swap it for another one from the same category and similar length.

**US-5. Edit my schedule**
As a user, I can change the plan, so that it fits my real week.

- Move a session to another day.
- Swap a video for a different suggestion from the same category.
- Change the category of a session (it gets new videos).
- Delete a session, or add one to a rest day.
- Every change is saved immediately.

**US-6. Come back later**
As a returning user, I see my plan exactly as I left it, so that I can continue.

- The plan, edits and statuses persist after reload and after closing the browser.
- I can retake the quiz to replace the plan, after a confirmation.
- I can reset all data.

### P2 — should have (after the first deploy, as a separate spec)

**US-7. Daily mood check-in**
As a user, when I open the app on a training day I can say how I feel today (e.g. 😴 / 🙂 / 🔥). If my mood doesn't fit the planned session, FitFlow suggests a lighter or harder alternative that I can accept or ignore.

**US-8. Progress summary**
As a user, I see simple stats: sessions done this week, current streak and minutes trained.

### P3 — nice to have

- **US-9.** Export the plan to my calendar app (.ics file).
- **US-10.** Light and dark theme.

## Quiz content (draft)

1. **How are you feeling lately?** Stressed · Tired · Okay · Motivated
2. **Energy level?** Low · Medium · High
3. **Main goal?** Reduce stress · Flexibility · Get fitter / lose weight · Build strength
4. **Days per week?** 2 · 3 · 4 · 5 · 6
5. **Time per session?** 10 · 20 · 30 · 45 min
6. **Plan length?** 1 week · 2 weeks · 4 weeks

## Functional requirements

- **FR-1** The video catalog is a static file in the repo. Each entry has: YouTube video ID, title, channel, duration (minutes), category, intensity (low / medium / high) and optional tags.
- **FR-2** The catalog has at least 10 videos per category with a spread of durations between 5 and 45 minutes.
- **FR-3** Plan generation runs entirely in the browser and is deterministic for a given set of answers and a seed.
- **FR-4** Every session in a generated plan refers only to videos in the catalog.
- **FR-5** All user state (answers, plan, edits, statuses) is stored locally, with a schema version so that later changes can migrate old data.
- **FR-6** If stored data is missing or corrupted, the app starts fresh at the landing page without crashing.

## Non-functional requirements

- **NFR-1** First load under 2 seconds on a typical broadband connection; YouTube players load only when a session is opened.
- **NFR-2** Usable from 360px phone width to desktop.
- **NFR-3** All controls work with the keyboard and have accessible labels.
- **NFR-4** No API keys or secrets in the repo or in the bundle.

## Out of scope

- Accounts, login, sync between devices.
- Fetching videos live from the YouTube API.
- AI or LLM-generated plans (possible later spec).
- Notifications or reminders.
- Nutrition, calorie tracking, wearables.

## Success criteria

- A new visitor goes from landing page to a generated calendar in under 60 seconds.
- 100% of generated plans pass the US-2 rules in automated tests across all quiz answer combinations.
- The deployed site works on the latest Chrome, Safari and Firefox, desktop and mobile.

## Decisions

- **Channels:** the 5 listed under Workout categories.
- **Quiz and categories:** confirmed as drafted.
- **Start date:** the plan starts on the day it is generated.
- **Scope:** the first release is P1 only. P2 (US-7, US-8) gets its own spec after the MVP is deployed.
