# 001 — Mood-based Workout Planner: Implementation Plan

**Status:** Approved · **Spec:** [spec.md](spec.md) · **Created:** 2026-10-21

## Overview

A client-only React app with four screens. All logic that decides anything (plan generation, schedule edits, storage) lives in plain JavaScript modules under `src/domain/` with no React imports, so it can be unit-tested. React components only render state and dispatch actions.

```
Landing ──▶ Quiz ──▶ generatePlan() ──▶ Calendar ──▶ Session
                                          ▲   │
                                          └───┘ edits via reducer → localStorage
```

## Stack and dependencies

| Need | Choice | Why |
|---|---|---|
| UI | React 19 + Vite (existing scaffold) | Already set up |
| Routing | `react-router` v8 | Real URLs and a working browser Back button; a session can be opened by link |
| State | React Context + `useReducer` | The state is one small object; no Redux needed |
| Dates | `date-fns` | Tree-shakable, avoids writing calendar math by hand |
| Styling | CSS Modules + CSS custom properties | Built into Vite, no extra dependency |
| Video | YouTube IFrame Player API (no key) | Embedding plus `onError` events to detect unavailable videos |
| Tests | Vitest | Native to Vite |

## Project structure

```
fitflow/
  src/
    data/
      catalog.json          # curated videos (FR-1, FR-2)
    domain/                 # pure JS, fully unit-tested
      quiz.js               # questions, options, answer validation
      weights.js            # answers → category weights + intensity filter
      random.js             # seeded PRNG (mulberry32)
      generatePlan.js       # answers + catalog + seed → Plan
      pickVideos.js         # fill a session to a target duration
      suggestions.js        # alternative videos for swap
      planReducer.js        # all edits as reducer actions
      storage.js            # load/save/migrate localStorage
      dates.js              # local-date helpers (YYYY-MM-DD)
    state/
      PlanProvider.jsx      # Context + useReducer + persistence effect
    pages/
      LandingPage.jsx
      QuizPage.jsx
      CalendarPage.jsx
      SessionPage.jsx
    components/
      WeekView.jsx, MonthView.jsx, DayCell.jsx,
      SessionEditor.jsx, VideoPlayer.jsx, ConfirmDialog.jsx, ...
    styles/tokens.css
  scripts/
    check-catalog.mjs       # validates the catalog (see Catalog)
  vercel.json
```

## Data model

```js
// Video: entry in catalog.json
{ id: "<youtube-video-id>", title: "...", channel: "MadFit",
  durationMin: 20, category: "functional", intensity: "medium", tags: ["no-equipment"] }

// category: "functional" | "cardio" | "stretching" | "yoga" | "calm"
// intensity: "low" | "medium" | "high"

// QuizAnswers
{ mood: "stressed"|"tired"|"okay"|"motivated",
  energy: "low"|"medium"|"high",
  goal: "stress"|"flexibility"|"fitness"|"strength",
  daysPerWeek: 2..6, sessionMinutes: 10|20|30|45, weeks: 1|2|4 }

// Session
{ id: "s_3f9a", date: "2026-10-23", category: "yoga",
  videoIds: ["..."], status: "planned"|"done"|"skipped" }

// Plan
{ startDate: "2026-10-21", endDate: "2026-11-03", seed: 123456, sessions: Session[] }

// Persisted under localStorage key "fitflow"
{ version: 1, answers: QuizAnswers, plan: Plan }
```

Dates are local `YYYY-MM-DD` strings rather than `Date` objects or ISO timestamps, so a session never moves to another day because of the time zone. Rest days are not stored: they are any day in the plan without a session.

## Plan generation

`generatePlan(answers, catalog, { seed, today })` is pure and deterministic (FR-3). **Regenerate** calls it again with a new random seed.

1. **Category weights.** Each answer adds points to categories using a lookup table in `weights.js`. Example rows:

   | Answer | functional | cardio | stretching | yoga | calm |
   |---|---|---|---|---|---|
   | mood: stressed | 0 | 0 | 1 | 2 | 3 |
   | energy: high | 2 | 3 | 0 | 1 | 0 |
   | goal: strength | 4 | 1 | 1 | 0 | 0 |

   Every category keeps a minimum weight of 1 so that plans stay varied.

2. **Intensity filter.** Energy low → `low`/`medium` videos, medium → all, high → `medium`/`high`. Calm and Stretching are never filtered out.

3. **Training days.** Each week, from today, uses a fixed spread pattern, e.g. 3 days → offsets `[0, 2, 4]`, 4 → `[0, 1, 3, 5]`. Days outside the pattern are rest days.

4. **Category per session.** Weighted random choice with the seeded PRNG. The same category is not allowed more than 2 sessions in a row.

5. **Videos per session** (`pickVideos.js`). Target = `sessionMinutes`, tolerance = `max(5, 0.25 × target)`.
   - Prefer a single video within tolerance.
   - Otherwise combine 2–3 shorter videos of the same category, greedily, until the total is within tolerance.
   - Skip videos used in the previous 7 days; if that leaves nothing, allow repeats (US-2).

The tests run the generator across all 2,880 quiz answer combinations × several seeds and check the US-2 rules: session days, duration tolerance, no repeats within 7 days where possible, only catalog IDs (FR-4).

## Editing (US-5, US-4)

All changes go through `planReducer(state, action)`:

| Action | Behaviour |
|---|---|
| `MOVE_SESSION {id, toDate}` | If the target day already has a session, the two swap places. Target must be inside the plan range. |
| `SWAP_VIDEO {id, index, videoId}` | Replaces one video; options come from `suggestions.js` (same category, closest duration, not already in the session). |
| `CHANGE_CATEGORY {id, category}` | Re-runs `pickVideos` for that session. |
| `DELETE_SESSION {id}` | Day becomes a rest day. |
| `ADD_SESSION {date, category}` | Only on a rest day inside the plan range. |
| `SET_STATUS {id, status}` | planned / done / skipped. |
| `REPLACE_PLAN {answers, plan}` | After the quiz or Regenerate. |
| `RESET` | Clears everything. |

Editing uses buttons and menus in a session editor (dialog), not drag-and-drop, so every action works with the keyboard (NFR-3). Drag-and-drop can be added later on top of the same actions.

## Persistence (US-6, FR-5, FR-6)

- `PlanProvider` saves state to `localStorage` after every change.
- `storage.load()` wraps everything in `try/catch`, checks `version` and the shape of the data, and returns `null` if anything is wrong, so the app starts fresh on the landing page.
- `migrate(data)` is the place for future version upgrades (only `version: 1` for now).
- If `localStorage` is unavailable (e.g. private mode), the app still works for the current visit.

## Screens and routes

| Route | Screen | Notes |
|---|---|---|
| `/` | Landing | "Start quiz", or "Continue my plan" if a plan exists |
| `/quiz` | Quiz | One question per step, progress bar, Back. Answers kept in component state until the last step |
| `/calendar` | Calendar | `?view=week` (default) or `month`. Today is highlighted. Buttons: Regenerate, Retake quiz, Reset (with confirmation) |
| `/session/:id` | Session | Player, video list, Done / Skipped, swap video, edit |

Unknown routes or a missing session ID redirect to `/` or `/calendar`. `vercel.json` rewrites all paths to `index.html` so links work after a reload.

## Video player

- `VideoPlayer` loads the YouTube IFrame API script only when a session page opens (NFR-1), using `youtube-nocookie.com`.
- On `onError` (codes 100, 101, 150: removed or embedding disabled), the player shows "This video is unavailable" and a **Swap video** button (US-4).

## Catalog

- `src/data/catalog.json` is filled by hand from the 5 channels: at least 10 videos per category, with durations between 5 and 45 minutes (FR-2).
- `scripts/check-catalog.mjs` (`npm run check:catalog`):
  - checks every entry against the schema and the per-category minimums;
  - calls YouTube's public oEmbed endpoint for each ID (no key) to confirm the video still exists and allows embedding.
- Durations, categories and intensity are entered manually, because oEmbed does not return them.

## Testing

- **Unit (Vitest):** `weights`, `pickVideos`, `generatePlan` (all answer combinations), `suggestions`, `planReducer` (each action), `storage` (corrupted JSON, wrong version, unavailable storage), `dates`.
- **Manual:** the acceptance criteria from spec.md on Chrome, Safari, Firefox, and on a 360px mobile viewport, before each deploy.

## Deployment

- Vercel project with root directory `fitflow/`, auto-deploy from `main`.
- Before deploying: `npm run lint && npm test && npm run build`.

## Risks

| Risk | Mitigation |
|---|---|
| Videos get deleted or block embedding | `check:catalog` script, plus in-app Swap on error |
| Not enough short or calm videos | Allow combining videos; a small number from extra channels (allowed by spec) |
| Time zone bugs around midnight | Local `YYYY-MM-DD` strings everywhere; tests for `dates.js` |
| Catalog curation takes a long time | Start with the minimum of 10 per category; grow later |

## Spec traceability

| Spec item | Where |
|---|---|
| US-1 | `QuizPage`, `domain/quiz.js` |
| US-2, FR-3, FR-4 | `generatePlan.js`, `weights.js`, `pickVideos.js` |
| US-3 | `CalendarPage`, `WeekView`, `MonthView` |
| US-4 | `SessionPage`, `VideoPlayer`, `suggestions.js` |
| US-5 | `planReducer.js`, `SessionEditor` |
| US-6, FR-5, FR-6 | `storage.js`, `PlanProvider` |
| FR-1, FR-2 | `catalog.json`, `check-catalog.mjs` |
| NFR-1 | Lazy-loaded IFrame API |
| NFR-2, NFR-3 | CSS Modules, dialog-based editing, manual checks |
| NFR-4 | No keys anywhere; oEmbed needs none |
