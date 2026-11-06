# 005 — Test Automation: Typed, Structured and Running on Every Push

**Status:** Approved · **Approved:** 2026-11-06 · **Created:** 2026-11-06 · **Builds on:** [002](../002-ui-refresh/spec.md) (the e2e suite), [004](../004-trainers/spec.md)

## Summary

FitFlow already has 191 unit tests and an end-to-end suite of about 70 tests that runs in 6 browser and screen combinations. This release turns that suite into a showcase of test automation: tests written in TypeScript and organised around page objects, run automatically on every push and every night against the live site, with readable reports and visual checks of both themes. No user-facing feature changes.

## Why

- **Nothing runs automatically.** Every test run so far was started by hand on one laptop. A broken push would reach the live site unnoticed until someone ran the suite.
- **The catalog can rot silently.** YouTube videos get deleted or made private; today only a manual `npm run check:catalog` would notice.
- **The suite is hard to read as a portfolio piece.** Selectors and steps are repeated across spec files; an interviewer has to read helpers to understand a test. Page objects and types make the intent visible.
- **Looks are not tested.** The tests check behaviour and accessibility, but a CSS mistake that makes selected trainers look unselected (found by hand in 004) passes them all.
- **"Phone" today is a small desktop window**, without touch or a mobile user agent.

## Users

- **The developer** (the user, with Claude): wants to know within minutes that a push broke nothing, and every morning that the live site and its videos still work.
- **An interviewer** reading the repo: wants to see a well-organised, typed test suite, green CI badges and a report they can open without installing anything.

## User stories

### P1 — must have

**US-1. Tests run on every push**
As the developer, every push to `main` and every pull request runs lint, unit tests, the production build and the full e2e suite, and a failure is visible on GitHub.

- The result is shown as a check on the commit and a badge in the README.
- A failed e2e run keeps what is needed to understand it: the report, traces and screenshots of failures.
- The run takes under 15 minutes.

**US-2. The live site is checked every night**
As the developer, I learn every morning whether the live site still works and whether every catalog video is still available.

- A scheduled run executes the e2e suite against the live URL and runs the catalog check.
- It can also be started by hand, for example right after a deploy.
- A failure sends GitHub's usual failed-workflow notification.

**US-3. Readable, typed tests**
As an interviewer, I can read a test and understand the user flow without opening helper files.

- E2e tests and their support code are written in TypeScript and type-checked in CI.
- Each page and shared component the tests use (Landing, Quiz, Today, Calendar, Workout, Trainers, Trainer, dialogs, tab bar) has one page object that owns its locators and actions; spec files contain no raw selectors.
- Repeated setup (a plan, a theme, a saved choice of trainers) comes from Playwright fixtures, not copied steps.
- Every existing test keeps checking what it checks today: the number of covered acceptance criteria does not go down.

**US-4. A report anyone can open**
As an interviewer, I can open the latest test report from the README.

- Two reports of the latest run on `main` are published at public URLs:
  - **Playwright's HTML report:** every test with the browser and screen it ran in, and traces, screenshots and videos for failures; the everyday tool for debugging.
  - **Allure report:** tests grouped by feature and user story, with the trend of results across recent runs; the overview for readers.
- Both are linked from the README.

**US-5. Visual checks of both themes**
As the developer, a change that alters how a key screen looks fails a test until I accept the new look.

- Visual checks run in Chromium only, desktop and phone; Firefox and WebKit keep their behaviour and accessibility tests.
- Screenshots of the key screens (Landing, Quiz, Today, Calendar week and month, Workout, Trainers, a trainer's page) in both themes, on desktop and phone, are compared with approved baselines.
- Content that changes from day to day (dates, YouTube thumbnails and the player) is fixed or masked so the comparison is stable.
- Baselines are created in the same environment CI uses, so they don't depend on the developer's computer.
- Updating baselines is one documented command, and the change shows up as images in the pull request.

### P2 — should have

**US-6. Real phone emulation**
As the developer, phone tests run as a phone: touch, a mobile user agent and the screen size and pixel density of an iPhone and an Android phone, not just a narrow desktop window.

**US-7. Coverage of the domain logic**
As the developer, I see how much of `src/domain/` the unit tests cover, and CI fails if it drops below a threshold. The current coverage is measured first, and the threshold is set a few points below it, so it guards against a drop without blocking small changes.

## Functional requirements

- **FR-1** CI runs on GitHub Actions (free for public repositories). No secrets or API keys are needed: the app and its checks use only public URLs.
- **FR-2** The e2e suite keeps running in Chromium, Firefox and WebKit, at desktop and phone sizes, against a local production build in CI and against the live URL at night.
- **FR-3** The app itself stays in JavaScript; only the e2e tests and their support code move to TypeScript. The constitution is amended to say so.
- **FR-4** The README documents how to run each kind of test, update visual baselines and open the reports.

## Non-functional requirements

- Everything from 001–004 still holds; no app behaviour changes.
- Flaky tests are fixed, not retried into passing: CI allows one retry only to report flakiness, and a test that needed a retry is visible in the report.
- Test runs stay independent: any test can run alone, in any order and in parallel.

## Out of scope

- Moving the app to TypeScript.
- Tests on real devices in a device cloud (BrowserStack and similar); real iPhone checks stay manual.
- Load or performance testing beyond the existing build checks.
- A second test framework (Cypress, Selenium).

## Success criteria

- Every push to `main` shows a green or red check within 15 minutes.
- The nightly live run has been green for 7 nights in a row, or every red night was a real problem.
- An interviewer can open the report and the CI history from the README in one click.
- A deliberate visual bug (like 004's quiz selection style) makes CI fail.

## Decisions

- **Approach:** improve the tests inside the FitFlow repo (option 1, chosen by the user on 2026-11-06), rather than a separate automation project.
- **Framework:** stay on Playwright, now with TypeScript.
- **Reports:** both Playwright's HTML report and Allure (user, 2026-11-06).
- **Visual checks:** Chromium only, desktop and phone, both themes (user, 2026-11-06).
- **Coverage threshold:** measured first, then set slightly below the measured level (user, 2026-11-06).

