# 004 — Trainers: Tasks

**Status:** Approved · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Created:** 2026-10-22

Tasks run in order, numbered from T301. A task is done when its **Done when** check passes; each ends with a commit naming the task ID.

Legend: `[ ]` to do · `[x]` done · **Checkpoint** = stop and review together.

Unless a task says otherwise, every task also requires: `npm test`, `npm run lint`, `npm run build` and the e2e suite (`caffeinate -i npm run test:e2e`) pass.

## Phase 1 — Trainers and catalog

- [x] **T301** `src/data/trainers.json` with the 10 approved trainers; a `trainer` field on all existing catalog videos; validation that every video's trainer exists. *(FR-1)*
- [x] **T302** Catalog draft for the new trainers (Caroline Girvan, Mila Tymchuk, Аня Лу, Йога Українською, ЙОГА ДОПОМОГА) and more Tom Merrick videos: at least 8 per trainer, lengths 10–45 min, embeddable. Validation of the per-trainer minimum; `check:catalog` checks each video's channel against its trainer.
  Done when: `npm run check:catalog` passes, and `specs/004-trainers/catalog-review.md` lists every new video with its link, title, length, category and intensity, for the user to check.

**Checkpoint A:** the user goes through `catalog-review.md` and corrects lengths, categories or intensity where the videos differ (or swaps videos). Corrections go into `catalog.json` before Phase 2.

## Phase 2 — Domain logic

- [x] **T310** `domain/preferences.js`: `allowedVideos`, `availableCategories`, `validatePreferences`, `coverage`, `trainerSummary`, with tests. *(US-2, US-4, US-6)*
- [x] **T311** `generatePlan` with preferences: `fillSessions` split out, unavailable categories at weight 0, the "2 in a row" rule relaxed for a single type. Tests: every trainer alone × every third answer combination passes all 001 rules and uses only that trainer; type-restricted selections never produce other types. *(US-3, FR-3, FR-4)*
- [x] **T312** Schema version 3 with `preferences` (migration 2 → 3, and 1 → 3 through both steps); `rebuildFromToday`; `SET_PREFERENCES`; `REPLACE_PLAN` with preferences. Tests for each. *(US-5, FR-2)*
- [x] **T313** Everything that picks videos uses the allowed list: `suggestAlternatives`, `changeCategory`, `addSession`, `suggestFor`; editors list only available categories. Tests for each with a restricted selection. *(US-3)*

## Phase 3 — Screens

- [x] **T320** Trainers section in the header, the phone tab bar and the landing page; `/trainers` with category filter, trainer cards, selection (max 5, "Any trainer"), workout-type toggles, and Save with a confirmation when a plan exists. *(US-1, US-2, US-5, US-6)*
  Done when: e2e covers filtering, the 5-trainer limit, Clear, type toggles, and Save rebuilding sessions from today while keeping a done session.
- [ ] **T321** `/trainers/:id`: the trainer's videos by category. *(US-1)*
- [ ] **T322** Quiz step 7, "Who do you want to train with?", with the coverage warning; the e2e `createPlan` helper updated for the new step. *(US-2, US-4)*
  Done when: e2e checks a single-trainer plan uses only that trainer, and the warning appears for a selection that can't fill the chosen length.
- [ ] **T323** Trainer name on session cards and the workout page, linking to the trainer page. *(US-7)*

**Checkpoint B:** review the Trainers page, trainer page, quiz step and trainer names in both themes, desktop and phone.

## Phase 4 — Release

- [ ] **T330** Verification: accessibility for the new pages and states in both themes, full unit and e2e runs, `check:catalog`. Record results in `specs/004-trainers/acceptance.md`.
- [ ] **T331** README: trainers in "What it does", screenshots, the 004 docs in the SDD table, test counts.
- [ ] **T332** Push to `main`, run the e2e suite against the live site, and ask the user to try a single-trainer plan on their iPhone.
  Done when: the live run is green and the user has checked it.
