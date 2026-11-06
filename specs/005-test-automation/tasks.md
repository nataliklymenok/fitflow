# 005 — Test Automation: Tasks

**Status:** Draft · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Created:** 2026-11-06

Tasks run in order, numbered from T401. A task is done when its **Done when** check passes; each ends with a commit naming the task ID.

Legend: `[ ]` to do · `[x]` done · **Checkpoint** = stop and review together.

Unless a task says otherwise, every task also requires: `npm test`, `npm run lint`, `npm run build` and the e2e suite pass, and from T402 on, **the CI run for the commit is green**. No app behaviour changes in this release; a bug found by the new tests is fixed in its own commit, named after the task that found it, and recorded in `acceptance.md`.

## Phase 1 — CI for today's suite

- [ ] **T401** `ci.yml` with the `checks` job (lint, unit tests, build) and three e2e jobs (chromium, firefox, webkit) in the Playwright 1.64.1 container, each uploading its HTML report as an artifact; a check that the container tag matches `@playwright/test`. CI settings in `playwright.config.js` (`retries: 1`, `failOnFlakyTests`, blob reporter). *(US-1)*
  Done when: a push to `main` shows all four jobs green on GitHub.
- [ ] **T402** Fix whatever fails or flakes on Linux in T401, in the app or the tests, each with a short note in `acceptance.md`. If nothing does, this task records that. *(US-1, NFR)*
  Done when: three pushes in a row are green with no flaky tests.

## Phase 2 — TypeScript, page objects and fixtures

- [ ] **T410** TypeScript tooling for `e2e/`: `e2e/tsconfig.json` (strict), typescript-eslint for `e2e/**/*.ts`, `npm run typecheck` in the `checks` job; `support/` (storage, axe, data) and `fixtures.ts` in TypeScript, with the automatic `noPageErrors` fixture and `theme`, `planned`, `seeded` fixtures; the current test list saved to `specs/005-test-automation/test-list-before.txt`. *(US-3, FR-3)*
  Done when: `tsc --noEmit` passes, and an existing spec file runs unchanged importing from the new fixtures.
- [ ] **T411** Page objects for Landing, Quiz, Today, Calendar, Workout, Trainers and Trainer, and the shared components (Nav, CheckIn, ConfirmDialog, SessionEditor, AddSessionDialog, ChoiceSummary). *(US-3)*
  Done when: they type-check and are used by at least one migrated spec (T412).
- [ ] **T412** Migrate `quiz`, `navigation`, `theme` and `motion` specs to `specs/*.spec.ts` using page objects and fixtures; no raw selectors left in them. *(US-3)*
- [ ] **T413** Migrate `today`, `checkin`, `calendar` and `session` specs. *(US-3)*
- [ ] **T414** Migrate `trainers`, `persistence`, `export`, `keyboard` and `accessibility` specs; remove `helpers.js` and the old files. *(US-3)*
  Done when: `playwright test --list` matches `test-list-before.txt` (71 tests, 426 runs, same titles), and no `.js` file is left in `e2e/`.
- [ ] **T415** Real phone emulation: `Pixel 7` and `iPhone 15` profiles, Firefox phone with touch; fix what this finds. *(US-6)*
  Done when: all phone projects are green in CI, with each finding noted in `acceptance.md`.

**Checkpoint A:** read two or three migrated spec files and their page objects together, and look at a CI run on GitHub.

## Phase 3 — Visual checks

- [ ] **T420** `visual-desktop` and `visual-phone` projects (Chromium, `e2e/visual/` only, local runs only with `VISUAL=1`); the `seeded` state fixture with a fixed plan and fixed clock; `visual.spec.ts` for the 9 screens in both themes, thumbnails and player masked. *(US-5)*
- [ ] **T421** `update-snapshots.yml`; run it to create the 36 Linux baselines and commit them; visual tests run in the chromium CI job. *(US-5)*
  Done when: CI is green with the baselines, and on a test branch, reintroducing 004's quiz selection bug makes the visual job fail with a diff image in the report.

## Phase 4 — Reports, coverage and the nightly run

- [ ] **T430** Coverage: `@vitest/coverage-v8` for `src/domain/`; measure, then set thresholds 5 points below each measured value; summary in the CI job summary. *(US-7)*
  Done when: the measured values and thresholds are recorded in `acceptance.md`, and lowering a threshold above the measured value fails `npm test`.
- [ ] **T431** Allure: `allure-playwright` reporter, the automatic `allureLabels` fixture (spec, user story, file), Allure 3 report generated from the merged results in CI. *(US-4)*
  Done when: the Allure report from a CI artifact shows tests grouped under 001–004 and their user stories.
- [ ] **T432** Publishing: the `report` job merges blob reports into the HTML report and Allure, and on `main` pushes `/main/playwright`, `/main/allure` and `/main/coverage` plus an index page to `gh-pages`, keeping Allure history. The user switches on GitHub Pages for `gh-pages` once. *(US-4)*
  Done when: all three reports open from the public Pages URL, and the Allure trend shows at least two runs.
- [ ] **T433** `nightly.yml`: cron at 03:00 UTC and manual start; `check:catalog`, then e2e against the live site without visual tests; publishes to `/nightly/`. *(US-2)*
  Done when: a manual start is green and its reports are published.

**Checkpoint B:** go through the published reports, a failure report from the T421 test branch, and the CI and nightly history together.

## Phase 5 — Release

- [ ] **T440** Constitution: the testing rule (TypeScript e2e, CI on every push, nightly live check). README: CI and nightly badges, links to the reports, a Testing section (running each kind of test, updating baselines, reading reports), new counts. *(FR-3, FR-4)*
- [ ] **T441** Verification: `specs/005-test-automation/acceptance.md` with every user story and requirement checked, the findings from T402 and T415, coverage values, and run times.
  Done when: seven nightly runs have finished, and each was green or failed for a real reason that is recorded (spec success criteria).
