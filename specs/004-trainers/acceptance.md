# 004 — Trainers: Acceptance

**Run:** 2026-10-23 · **Build:** production build served by `vite preview` · **Spec:** [spec.md](spec.md)

## Totals

| Suite | Result |
|---|---|
| Unit tests (Vitest) | 191 passed |
| End-to-end (Playwright): Chromium, Firefox and WebKit, each at 1280×900 and 390×844 | 414 passed, 12 skipped by design (desktop-only or phone-only checks) |
| Accessibility (axe-core), both themes: Trainers page (default, error, saved), a trainer's page, the quiz trainers step with a warning | 0 violations |
| `check:catalog`: schema, trainers, covers, and every video available on YouTube | OK (125 videos, 9 trainers) |
| Lint, production build | pass |

Found and fixed by the new accessibility audit:

- The **Select** button kept the name "Select {trainer}" while showing "✓ Selected" (label-content-name-mismatch). The trainer's name is now hidden text inside the button, so the name follows what is shown.
- On a selected card in the dark theme, the Cardio chip had 4.06:1 contrast on the tinted card background. Selected cards now keep the plain background and show selection with the border and the button.

## User stories

| Criterion | How it is checked | Result |
|---|---|---|
| **US-1** Trainers page from the navigation and the landing page | `trainers.spec.js`, `navigation.spec.js` | ✅ |
| **US-1** Filter by type; a trainer appears under every type they teach | `trainers.spec.js` | ✅ |
| **US-1** Card: name, description, types, video count, length range, language, YouTube link | `trainers.spec.js` | ✅ |
| **US-1** A trainer's page lists their videos by type | `trainers.spec.js` | ✅ |
| **US-1** Picture from one of the trainer's own videos; initials if it can't load | unit tests (cover is their own video), `trainers.spec.js` (with YouTube images blocked) | ✅ |
| **US-2** Choose trainers in the quiz step and on the Trainers page; "any trainer" by default | `quiz.spec.js`, `trainers.spec.js` | ✅ |
| **US-2** A sixth trainer is refused with an explanation | `trainers.spec.js` | ✅ |
| **US-2** Remembered on this device, also before a plan exists | storage tests, `trainers.spec.js` | ✅ |
| **US-2** After saving: "✓ Saved", what happened to the plan, a link to Today (or the quiz); Clear above Save | `trainers.spec.js` | ✅ |
| **US-3** Plans, swaps and suggestions use only the chosen trainers and types | unit tests (`generatePlan`, `restrictedPicking`: swaps, type changes, added sessions, daily suggestions) | ✅ |
| **US-3** Yoga-and-stretching-only choices never produce other types | unit tests | ✅ |
| **US-4** The quiz warns when the choice can't fill the session length, and blocks when nothing fits | `quiz.spec.js` | ✅ |
| **US-5** Saving a new choice rebuilds sessions from today; done sessions and check-ins stay | reducer tests, `trainers.spec.js` | ✅ |
| **US-6** Type toggles, at least one on; a choice that leaves nothing is refused | unit tests, `trainers.spec.js` | ✅ |
| **US-7** Trainer name on session cards, Today and the workout page, linking to their page | `trainers.spec.js` | ✅ |

## Requirements

| Requirement | How it is checked | Result |
|---|---|---|
| **FR-1** Trainers list; every video belongs to one trainer on that trainer's channel; at least 8 videos each | catalog validation in unit tests and `check:catalog` | ✅ |
| **FR-2** Choice stored in schema version 3; version 2 data migrates to "any trainer, all types" | storage tests with version 1 and 2 data, `persistence.spec.js` | ✅ |
| **FR-3** Selection-aware generation and suggestions stay pure and unit-tested for every trainer | `generatePlan.test.js`, `preferences.test.js`, `restrictedPicking.test.js` | ✅ |
| **FR-4** Every trainer alone can fill every session length | every trainer fills 20, 30 and 45 minutes; for 10 minutes, see below | ⚠️ partial |
| Everything from 001–003 still holds | all earlier unit, e2e and accessibility tests pass | ✅ |

**Known limitation (FR-4):** Mila Tymchuk and Ольга Пасічник have no videos of 15 minutes or less in the catalog, so either of them alone can't fill 10-minute sessions. The quiz says so and doesn't create the plan (US-4); adding any other trainer fixes it. This was noted in [catalog-review.md](catalog-review.md) at Checkpoint A. It can be closed by adding short videos from their channels.

## Live site

After deployment, the full end-to-end suite ran against https://fitflow-nk-lymenok.vercel.app on 2026-10-23: **414 passed, 12 skipped by design**, in all six browser and viewport combinations, including the accessibility audits of the trainers screens.

## Manual checks

- A single-trainer plan on a real iPhone: to be checked by the user (T332).
