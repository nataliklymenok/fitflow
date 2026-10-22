# 004 — Trainers: Implementation Plan

**Status:** Draft · **Spec:** [spec.md](spec.md) · **Created:** 2026-10-22

## Overview

The user's choice of trainers and workout types becomes a **filter on the video catalog**. Every place that picks videos (plan generation, swaps, category changes, added sessions, check-in suggestions) receives the filtered list instead of the whole catalog, so the rules from 001–003 keep working unchanged on a smaller pool. The only real change to the algorithm is that some workout types can be unavailable.

```
trainers.json ─┐
catalog.json ──┼─▶ allowedVideos(videos, preferences) ─▶ generatePlan / suggestions / editors
preferences ───┘            │
                            └─▶ coverage() ─▶ quiz warning (US-4)
```

## Data

**`src/data/trainers.json`** (FR-1):

```js
{ id: 'mila-tymchuk', name: 'Mila Tymchuk', channel: 'Mila Tymchuk',
  url: 'https://www.youtube.com/@milatymchuk', language: 'uk',
  description: 'Home workouts in Ukrainian: functional, HIIT and Pilates.' }
```

`channel` is the exact YouTube author name, so `check:catalog` can confirm every video belongs to its trainer.

**`catalog.json`**: each video gains `trainer` (an id from `trainers.json`); `channel` stays for display and the oEmbed check. The catalog grows to about 140 videos: at least **8 per trainer** with lengths spread over 10–45 minutes, and still at least 10 per category overall (FR-4). Tom Merrick needs more videos; any trainer that can't reach 8 short-enough embeddable videos is swapped for an approved alternate.

**Validation** (`domain/catalog.js` + `check:catalog`): every video's trainer exists, every trainer has at least 8 videos, oEmbed author matches the trainer's channel.

## Preferences and migration (FR-2)

```js
preferences: {
  trainers: [],                 // trainer ids; empty = any trainer
  categories: ['functional', 'cardio', 'stretching', 'yoga', 'calm'],
}
```

- Stored with the plan in **schema version 3**; `migrate()` gains a step 2 → 3 that adds the defaults above. A version 1 fixture still migrates through both steps.
- `RESET` deletes the preferences along with the plan and check-ins; only the theme survives, as before.

## Domain logic (FR-3, FR-4)

New **`domain/preferences.js`**:

| Function | Does |
|---|---|
| `allowedVideos(videos, preferences)` | Videos from the selected trainers (all if none) in switched-on categories |
| `availableCategories(videos, preferences)` | Categories that still have videos |
| `validatePreferences(preferences, videos)` | Errors: more than 5 trainers, no category on, or nothing left ("Mila Tymchuk has no yoga videos") |
| `coverage(videos, preferences, sessionMinutes)` | Categories whose videos can't fill a session of that length within tolerance (US-4 warning) |
| `trainerSummary(trainer, videos)` | Categories, video count and length range for the trainer card |

**`generatePlan`** takes `preferences` (default: any trainer, all categories):
- filters the catalog with `allowedVideos`;
- category weights are zeroed for unavailable categories; the minimum weight of 1 applies only to available ones;
- "no more than 2 of the same type in a row" is skipped when only one type is available;
- everything else (training days, lengths, no-repeat window) is unchanged.

The sessions-filling part of `generatePlan` is split out as **`fillSessions(dates, …)`** so it can be reused:

**`rebuildFromToday(state, catalog, preferences, { today, seed })`** (US-5): keeps sessions before today and any session already done or skipped; refills planned sessions from today onwards on the same dates with `fillSessions`. Check-ins and the streak are untouched.

**Everything else that picks videos** gets the filtered list from one hook, `useAllowedVideos()`: video swap (`suggestAlternatives`), `changeCategory`, `addSession`, and `suggestFor` (003), which also only suggests available categories and returns nothing if none fit. The session editor and the "add session" dialog list only available categories.

## Reducer

| Action | Effect |
|---|---|
| `SET_PREFERENCES { preferences, plan }` | Saves the preferences; when a plan exists, replaces it with the rebuilt one from the action creator |
| `REPLACE_PLAN` | Now also takes `preferences` (from the quiz) |

## UI

- **Navigation:** a third section, **Trainers** (header and phone tab bar); a "Meet the trainers" link on the landing page.
- **`/trainers`**:
  - category filter (toggle chips; shows trainers who teach that type);
  - trainer cards: initials avatar in a color from the trainer id, name, language badge, short description, category chips, "18 videos · 10–45 min", YouTube link, and a **Select** toggle (`aria-pressed`);
  - a sticky bar: "2 of 5 selected" or "Any trainer", **Clear**, workout-type toggles, and **Save** (with a confirmation that sessions from today will be rebuilt, when a plan exists).
- **`/trainers/:id`**: the trainer's videos grouped by category, with lengths.
- **Quiz:** a 7th step, **"Who do you want to train with?"**, with the same compact trainer picker and type toggles, and a **Create my plan** button. It comes last because it needs the chosen session length to show the coverage warning (US-4). The step is skippable ("Any trainer" pre-selected).
- **Session cards and the workout page** show the trainer's name, linking to their page (US-7).
- Validation messages (sixth trainer, nothing left, coverage) are shown inline and announced with `role="status"`.

## Testing

- **Unit:**
  - `preferences.js`, every function;
  - `generatePlan` with every trainer alone, for every third quiz answer combination and every session length: all US-2 rules from 001 hold, and only that trainer's videos are used (FR-4);
  - yoga-and-stretching-only selections never produce other types;
  - `rebuildFromToday` keeps past, done and skipped sessions;
  - migration 2 → 3 and 1 → 3;
  - catalog validation for trainer references and per-trainer minimums.
- **End-to-end:**
  - the Trainers page filter, selection limit and Save;
  - the quiz step, with a single-trainer plan whose every session is from that trainer;
  - type toggles;
  - the coverage warning;
  - changing trainers with a plan that has a done session (kept), then sessions from today rebuilt;
  - the trainer name on cards;
  - accessibility in both themes;
  - all earlier tests updated for the 7th quiz step.
- **Catalog:** `npm run check:catalog` against YouTube for all ~140 videos.

## Risks

| Risk | Mitigation |
|---|---|
| Some trainers lack enough short videos | Per-trainer minimum enforced by tests; alternates approved in the spec |
| A single-trainer plan repeats videos a lot | The 7-day rule still applies where possible; spec tells the user (US-4) |
| Many tests assume a 6-question quiz | The e2e helper `createPlan` gains the trainer step once, and every test uses it |
| Catalog curation takes long | Durations come from titles or descriptions; videos without a stated length are skipped, as in 001 |

## Spec traceability

| Spec item | Where |
|---|---|
| US-1, US-7 | `TrainersPage`, `TrainerPage`, `trainerSummary`, session cards |
| US-2, US-6 | quiz step, Trainers page, `validatePreferences` |
| US-3 | `allowedVideos`, `generatePlan`, `useAllowedVideos` |
| US-4 | `coverage`, quiz warning |
| US-5 | `rebuildFromToday`, `SET_PREFERENCES` |
| FR-1, FR-4 | `trainers.json`, catalog validation, per-trainer tests |
| FR-2 | schema v3, `migrate()` |
| FR-3 | pure functions, unit tests |
