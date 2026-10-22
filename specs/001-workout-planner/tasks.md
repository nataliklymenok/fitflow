# 001 — Mood-based Workout Planner: Tasks

**Status:** Approved · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Created:** 2026-10-21

Tasks run in order. A task is done when its **Done when** check passes. Each one ends with a commit that names the task ID (e.g. `T012: quiz questions and validation`).

Legend: `[ ]` to do · `[x]` done · **Checkpoint** = stop and review together before going on.

## Phase 0 — Setup

- [x] **T001** Initial commit of the existing scaffold and `specs/`. Add a root `CLAUDE.md` describing the SDD workflow and linking to `specs/constitution.md`.
  Done when: `git log` shows the commit; `git status` is clean.
- [x] **T002** Remove the Vite demo content (counter, logos, `hero.png`, demo CSS). Set page title "FitFlow" and a simple favicon.
  Done when: `npm run dev` shows an empty "FitFlow" page; `npm run lint` passes.
- [x] **T003** Install `react-router`, `date-fns`; dev: `vitest`. Add scripts `test` and `test:watch`.
  Done when: `npm test` runs (0 tests) without errors.
- [x] **T004** Create `src/styles/tokens.css` (colors, spacing, radius, font sizes, one color per category) and a base layout shell (header + main).
  Done when: the shell renders at 360px and 1280px widths with no horizontal scroll.
- [x] **T005** Add `vercel.json` with an SPA rewrite to `index.html`.
  Done when: the file exists and `npm run build` passes.

## Phase 1 — Domain logic (pure JS, tested)

- [x] **T010** `domain/dates.js`: today as local `YYYY-MM-DD`, add days, range between dates, start of week, weekday name. Tests include dates around midnight and DST changes.
- [x] **T011** `domain/random.js`: seeded PRNG (mulberry32), `pick`, `weightedPick`, `shuffle`. Tests: same seed → same sequence.
- [x] **T012** `domain/quiz.js`: the 6 questions and options from spec.md, `isComplete(answers)`, `validate(answers)`. Tests for valid and invalid answers. *(US-1)*
- [x] **T013** `src/data/catalog.json`: draft catalog from the 5 channels, at least 10 videos per category, durations 5–45 min, with intensity and tags. Claude drafts it from public video pages; the user reviews the list. *(FR-1, FR-2)*
- [x] **T014** `scripts/check-catalog.mjs` + `npm run check:catalog`: schema check, per-category minimums, duplicate IDs, oEmbed availability check for every ID.
  Done when: the script passes on the catalog from T013 (fix or replace any failing videos).
- [x] **T015** `domain/weights.js`: answer → category points table, minimum weight 1, intensity filter by energy. Tests: stressed + low energy favors Calm/Stretching; motivated + high energy + strength favors Functional/Cardio. *(US-2)*
- [x] **T016** `domain/pickVideos.js`: fill a session to its target duration within tolerance (single video first, then 2–3 combined), respecting the 7-day no-repeat list with fallback. Tests for each branch. *(US-2)*
- [x] **T017** `domain/generatePlan.js`: training-day patterns per days-per-week, category choice (max 2 in a row), video picking, plan starts today. Tests: deterministic for a given seed; all 2,880 answer combinations × 3 seeds pass the US-2 rules and FR-4. *(US-2, FR-3, FR-4)*
- [x] **T018** `domain/suggestions.js`: alternatives for a video (same category, closest duration, not already in the session). Tests. *(US-4, US-5)*
- [x] **T019** `domain/planReducer.js`: all 8 actions from plan.md, including move-with-swap and range checks. One test group per action. *(US-5, US-4)*
- [x] **T020** `domain/storage.js`: `load`, `save`, `clear`, `migrate`; returns `null` on corrupted JSON, wrong version, wrong shape or unavailable storage. Tests for each case. *(US-6, FR-5, FR-6)*

Done when (whole phase): `npm test` passes and `npm run lint` passes.

**Checkpoint A:** review the catalog and a few sample generated plans (printed by a small script) before building UI.

## Phase 2 — State and routing

- [x] **T030** `state/PlanProvider.jsx`: Context + `useReducer(planReducer)`, initial state from `storage.load()`, saves after every change. Hook `usePlan()`.
- [x] **T031** Routes `/`, `/quiz`, `/calendar`, `/session/:id` with placeholder pages; redirects for unknown routes, missing plan and unknown session ID.
  Done when: every route renders its placeholder, and redirects behave as in plan.md.

## Phase 3 — Screens

- [x] **T040** Landing page: what FitFlow is, "Start quiz", or "Continue my plan" when a plan exists. *(US-1, US-6)*
- [x] **T041** Quiz page: one question per step, button options, progress bar, Back; on finish generate the plan, dispatch `REPLACE_PLAN`, go to `/calendar`. *(US-1, US-2)*
- [x] **T042** Calendar week view: 7 days with session (category, title, duration, status) or "Rest", today highlighted, previous/next week within the plan range. *(US-3)*
- [x] **T043** Month view and the `?view=week|month` toggle. *(US-3)*
- [x] **T044** Calendar actions: Regenerate, Retake quiz, Reset, each behind a `ConfirmDialog`. *(US-2, US-6)*
- [x] **T045** `VideoPlayer`: lazy-load the IFrame API, `youtube-nocookie.com`, error state for codes 100/101/150. *(US-4, NFR-1)*
- [ ] **T046** Session page: player, video list with titles/channels/durations, Done / Skipped, Swap video from suggestions. *(US-4)*
- [ ] **T047** `SessionEditor` dialog: move to another day, change category, delete; "Add session" on rest days in the calendar. *(US-5)*

**Checkpoint B:** walk through the full flow together in the browser.

## Phase 4 — Polish and release

- [ ] **T050** Responsive and accessibility pass: 360px to desktop, keyboard-only walkthrough, visible focus, labels on all controls, dialogs trap focus and close on Esc. *(NFR-2, NFR-3)*
- [ ] **T051** Portfolio `README.md`: what FitFlow does, screenshots, how it was built (SDD + AI, links to specs), how to run and test.
- [ ] **T052** Manual acceptance run: every acceptance criterion in spec.md on Chrome, Safari, Firefox and mobile; record results in `specs/001-workout-planner/acceptance.md`.
- [ ] **T053** Deploy to Vercel (root directory `fitflow/`, auto-deploy from `main`). Needs the user's Vercel and GitHub accounts.
  Done when: the public URL passes a smoke test of the full flow; the URL is added to the README.
