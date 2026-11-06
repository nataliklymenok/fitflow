# 005 — Test Automation: Implementation Plan

**Status:** Approved · **Spec:** [spec.md](spec.md) · **Created:** 2026-11-06

## Overview

Three layers, built in this order so each one protects the next:

```
1. CI first        GitHub Actions runs today's JS suite on every push   (US-1)
2. Rewrite         e2e → TypeScript, page objects, fixtures             (US-3, US-6)
                   CI proves the rewrite keeps every test passing
3. Add             visual checks, coverage, Allure, published reports,  (US-2, US-4,
                   nightly live run                                      US-5, US-7)
```

Starting with CI means the TypeScript rewrite happens under a safety net: every step of it runs the full suite on Linux, not only on the developer's Mac.

**Current state, measured 2026-11-06:** 13 spec files, 71 tests, 426 test runs across 6 projects (414 pass, 12 skip by design); Playwright 1.64.1; Vitest 5; no CI; no Docker on the developer's computer.

## Tools and versions

| Tool | Use | Note |
|---|---|---|
| Playwright 1.64.1 | e2e runner, HTML report, `toHaveScreenshot`, `merge-reports` | already installed; runs `.ts` tests without a build step |
| TypeScript 7 | `tsc --noEmit` type check of `e2e/` only | `allowJs` off; the app is not type-checked (FR-3) |
| typescript-eslint | lint rules for `e2e/**/*.ts` | added to the existing flat config |
| allure-playwright 3 + Allure 3 (`allure` npm package) | Allure results from the run, then the report | Allure 3 is pure Node: no Java needed |
| @vitest/coverage-v8 | coverage of `src/domain/` | same major version as Vitest |
| GitHub Actions + `mcr.microsoft.com/playwright:v1.64.1-noble` | CI runs inside the official Playwright image | same browsers, fonts and OS for every run, which visual baselines need |
| GitHub Pages (from a `gh-pages` branch) | publishing reports | a branch, not the Pages artifact action, so the main run and the nightly run can publish into separate folders without overwriting each other |

The Playwright image tag and the `@playwright/test` version must match; a check in CI fails if they drift.

## CI workflows (US-1, US-2)

**`.github/workflows/ci.yml`**: on push to `main` and on pull requests.

```
checks ──────────────┐  lint, tsc (e2e), unit tests with coverage, build
e2e (chromium) ──────┤  each in the Playwright container,
e2e (firefox)  ──────┤  desktop + phone projects of one browser,
e2e (webkit)   ──────┤  uploads a blob report
                     ▼
report               merge-reports → Playwright HTML + Allure;
                     on main only: publish to gh-pages /main/
```

- The three browser jobs run in parallel; the expected total is under 10 minutes (spec limit 15).
- Visual tests run in the chromium job (they are Chromium-only).
- `concurrency` cancels a superseded run on the same branch; publishing uses its own concurrency group so two runs never push to `gh-pages` at once.
- Failure artifacts (traces, screenshots, videos, visual diffs) are part of the HTML report and also uploaded as a workflow artifact for 14 days.

**`.github/workflows/nightly.yml`**: cron `0 3 * * *` (05:00 Kyiv) and `workflow_dispatch`.

- `check:catalog` (all videos still on YouTube, embeddable, right channel).
- The e2e suite with `BASE_URL` set to the live site, all browsers, **excluding visual tests** (the nightly run checks that the site works; visual approval belongs to pushes).
- Publishes to `gh-pages` `/nightly/`. A failure triggers GitHub's standard failed-workflow email.

**`.github/workflows/update-snapshots.yml`**: `workflow_dispatch` on a branch. Runs the visual tests with `--update-snapshots` in the same container and commits the new baselines to that branch, so they appear as image diffs in the pull request (US-5). This replaces a local Docker command, since the developer has no Docker.

## E2E structure (US-3)

```
e2e/
  tsconfig.json         strict, noEmit, resolveJsonModule (catalog and trainers are typed from the JSON)
  fixtures.ts           test = base.extend(...)
  pages/                one class per page or shared component
    LandingPage.ts  QuizPage.ts  TodayPage.ts  CalendarPage.ts  WorkoutPage.ts
    TrainersPage.ts  TrainerPage.ts
    components/  Nav.ts (header + tab bar)  CheckIn.ts  ConfirmDialog.ts
                 SessionEditor.ts  AddSessionDialog.ts  ChoiceSummary.ts
  support/
    storage.ts          stored(), seedState(), shiftPlan(), dates
    axe.ts              expectNoViolations()
    data.ts             quiz answer sets (FITNESS, STRESSED), typed catalog helpers
  specs/                the 13 spec files, renamed .spec.ts, one per feature area
  visual/visual.spec.ts
  __screenshots__/      visual baselines (Linux, Chromium)
```

**Page objects** expose user-level actions and locators (`quiz.answer('Okay')`, `quiz.createPlan()`, `trainers.select('Аня Лу')`, `trainers.save()`, `today.checkIn('Low')`), built on role-based locators as today. Assertions stay in spec files, so a test still reads as "do this, expect that"; a page object may offer locators for them (`trainers.status`).

**Fixtures** (`fixtures.ts`):

| Fixture | Gives |
|---|---|
| page objects (`landing`, `quiz`, `today`, …) | ready to use in any test |
| `theme` (option, default from the system) | sets `fitflow:theme` before the page loads |
| `planned` | a plan created through the quiz, with its stored state; takes the answers as an option |
| `seeded` | a fixed saved state written to `localStorage` (for visual tests and for tests that need a specific day) |
| automatic `noPageErrors` | fails the test on any uncaught page error (today's behaviour) |
| automatic `allureLabels` | reads "(004 US-2)" from the test title and sets the Allure epic (spec), story (US) and feature (spec file) |

**Migration rule:** files move one at a time, each in its own task. Before the first and after the last, `playwright test --list` is compared: the same 71 tests (426 runs) with the same titles. A title may change only to fix a typo, recorded in the task.

## Phone emulation (US-6)

| Project | Today | After |
|---|---|---|
| `chromium-phone` | Desktop Chrome at 390×844 | `devices['Pixel 7']`: touch, mobile UA, DPR 2.625 |
| `webkit-phone` | Desktop Safari at 390×844 | `devices['iPhone 15']`: touch, mobile UA, DPR 3 |
| `firefox-phone` | Desktop Firefox at 390×844 | 390×844 with `hasTouch` (Firefox does not support `isMobile`) |

Tests that check phone layout keep using the viewport width; the tab bar and dialogs are also checked with tap instead of click. Any test that only passed because the "phone" was a desktop browser is a finding to fix, not to skip.

## Visual checks (US-5)

- Two projects, `visual-desktop` (1280×900) and `visual-phone` (`Pixel 7`), Chromium only, matching only `e2e/visual/`. Other projects ignore that folder.
- Locally, visual projects run only when `CI` or `VISUAL=1` is set: baselines come from Linux, and a Mac renders fonts slightly differently.
- **Stable content:** the clock is fixed with `page.clock.setFixedTime` (2026-11-09 09:00); the saved state comes from a fixed fixture (`seeded`), not from the quiz, so the plan, videos and check-ins are always the same; YouTube thumbnails and the player iframe are masked; animations are disabled by `toHaveScreenshot`.
- Screens: Landing, Quiz (a question and the trainers step), Today (with a check-in suggestion), Calendar week and month, Workout, Trainers, a trainer's page, in dark and light: 9 screens × 2 themes × 2 sizes = 36 baselines.
- `snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}'` (no OS suffix: there is only one OS).
- Threshold: `maxDiffPixelRatio: 0.001`, tight enough that the 004 quiz bug (a border colour on one card) fails. A task proves it by reintroducing that bug on a branch.

## Reports (US-4)

- Playwright reporters in CI: `blob` per browser job; `merge-reports` produces `html` and, through `allure-playwright`, Allure results. Locally: `list` and `html` as today, Allure optional.
- **Allure:** epic = spec (001 Workout planner … 004 Trainers), story = user story, feature = spec file, plus browser and screen as parameters. History for the trend chart is kept by downloading the previous `history.jsonl` from `gh-pages` before generating, and publishing the new one with the report.
- **Published site** (`gh-pages`):

```
/                     index.html: links to every report, last updated
/main/playwright/     latest run on main
/main/allure/
/main/coverage/       Vitest coverage HTML
/nightly/playwright/  latest nightly run on the live site
/nightly/allure/
```

GitHub Pages is switched on for the `gh-pages` branch once, by hand in the repo settings (a task asks the user to do it).

## Coverage (US-7)

- `vitest run --coverage` with `include: ['src/domain/**']`, excluding tests and fixtures.
- First run measures; thresholds for statements, branches, functions and lines are then set **5 points below** each measured value, rounded down, and recorded in `acceptance.md`.
- CI prints the summary in the job summary and publishes the HTML report.

## Flakiness (NFR)

- CI: `retries: 1` and `failOnFlakyTests: true`, so a test that only passes on retry fails the run and is marked flaky in both reports. Locally: no retries, as today.
- `fullyParallel` stays on; fixtures give every test its own storage state, so order does not matter.

## Constitution and docs (FR-3, FR-4)

- `constitution.md`, testing rule: "e2e tests and their support code are TypeScript, type-checked in CI; the app stays JavaScript. Every push runs lint, unit tests, build and e2e on GitHub Actions; the live site is checked nightly."
- `README.md`: CI and nightly badges, links to the reports, a Testing section (how to run each kind of test, update visual baselines, read reports), new test counts.

## Risks

| Risk | Mitigation |
|---|---|
| CI on Linux finds failures that never happened on the Mac (fonts, timing, WebKit on Linux) | That is the point of running CI before the rewrite; each one is fixed in the app or the test, and recorded |
| YouTube is slow or blocks CI runners | Tests already avoid the player where they can; thumbnails and the player are masked or not awaited; `check:catalog` runs only in the nightly job, which reports instead of blocking pushes |
| Visual tests flake on font loading | Wait for `document.fonts.ready`; fonts are self-hosted |
| Real mobile emulation breaks tests that relied on hover | Fixed as findings (US-6) |
| TypeScript 7 is new | Only `tsc --noEmit` is used; if it misbehaves, pin TypeScript 5.x |

## Traceability

| Spec | Where |
|---|---|
| US-1 | `ci.yml` |
| US-2 | `nightly.yml` |
| US-3 | `e2e/pages`, `e2e/fixtures.ts`, TS migration |
| US-4 | merge-reports, Allure, `gh-pages` |
| US-5 | `e2e/visual`, `update-snapshots.yml` |
| US-6 | phone projects |
| US-7 | Vitest coverage thresholds |
| FR-3 | `e2e/tsconfig.json`, constitution |
| FR-4 | README Testing section |
