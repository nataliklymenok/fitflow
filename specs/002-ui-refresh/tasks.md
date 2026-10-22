# 002 — UI Refresh: Tasks

**Status:** Approved · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Created:** 2026-10-22

Tasks run in order. Numbering starts at T101 so commit messages never clash with spec 001's tasks. A task is done when its **Done when** check passes; each ends with a commit naming the task ID.

Legend: `[ ]` to do · `[x]` done · **Checkpoint** = stop and review together.

Unless a task says otherwise, every task also requires: `npm test`, `npm run lint` and `npm run build` pass.

## Phase 0 — Safety net (before any visual change)

- [x] **T101** Add `@playwright/test`. Move the 001 acceptance checks into `fitflow/e2e/` with a config that builds the app, starts `vite preview` and runs Chromium, Firefox and WebKit at 1280×900 and 390×844. Add `npm run test:e2e`.
  Done when: every 001 acceptance check passes on the current UI in all 6 combinations.
- [x] **T102** Add `@axe-core/playwright` and an accessibility test that audits landing, quiz, calendar (week and month), workout page, the edit dialog and a confirm dialog.
  Done when: 0 violations on the current UI.

## Phase 1 — Foundations

- [x] **T110** Self-hosted fonts: `@fontsource/barlow-condensed` (600/700/800, latin) and `@fontsource-variable/inter` (latin), imported once in `main.jsx`; font stacks as tokens. *(FR-3, NFR-4)*
- [x] **T111** Semantic tokens: rewrite `tokens.css` with the dark and light token sets from the plan, keyed by `:root[data-theme]`; replace the old token names in every CSS module. `color-scheme` per theme. Category tokens per theme and a `categoryVars(category)` helper used wherever `--category-color` is set today.
  Done when: the app renders correctly with `data-theme="dark"` and with `"light"` set by hand; e2e still green.
- [x] **T112** `storage.js`: `loadTheme()` / `saveTheme()` under `fitflow:theme`; `clear()` leaves it alone. Unit tests, including unavailable storage. *(FR-4)*
- [x] **T113** Inline theme script in `index.html` (saved choice, else system setting), `ThemeProvider` + `useTheme()`, `ThemeToggle` in the header, `<meta name="theme-color">` kept in sync. A unit test checks the script and `storage.js` use the same key. *(US-4, FR-5)*
  Done when: e2e checks that the toggle switches theme, the choice survives a reload and a Reset, a first visit follows the system setting, and `data-theme` is already set before React mounts.

## Phase 2 — Today and navigation

- [x] **T120** `domain/today.js`: `todayStatus(plan, today)` and `planProgress(plan, minutesOf)` with unit tests for training day, rest day (with and without a next session), before the start, after the end, nothing done, all done. *(US-1, FR-1, FR-2)*
- [x] **T121** `TodayPage` at `/today`: hero card (Start, Swap), rest / finished / upcoming states, progress tiles, compact week with a link to the calendar. Move `SwapOptions` to `components/`; add a `compact` prop to `WeekView`. Routing: `/` redirects to `/today` when a plan exists; the quiz finishes on `/today`. *(US-1)*
  Done when: e2e covers each Today state and the new redirects; the 001 e2e checks are updated only where the spec changed behavior (quiz → Today).
- [x] **T122** Navigation: header `NavLink`s Today and Calendar; `BottomTabBar` below 640 px when a plan exists, header nav hidden there; content padding includes `env(safe-area-inset-bottom)`. *(US-2)*
  Done when: e2e checks `aria-current` on the active link/tab, the tab bar is visible only on phones, and no content is hidden behind it.

**Checkpoint A:** review Today and navigation in both themes, desktop and phone.

## Phase 3 — Restyle

- [x] **T130** Base styles and shared pieces: `index.css`, `ui.module.css` (buttons, chips, cards, focus ring), `Layout`, `Dialog`, `ConfirmDialog`, `SessionEditor`, `AddSessionDialog`. *(US-3)*
- [x] **T131** Landing page: tagline, two-tone headline, outlined category chips, numbered steps, credits. *(US-3)*
- [x] **T132** Quiz: segmented progress with "N to go", option tiles with hints (`hint` on every option in `domain/quiz.js`, with a unit test). *(US-3)*
- [x] **T133** Calendar: header actions, period navigation, segmented Week/Month, day cells with top-colored session cards, Done badge, highlighted today, month view and legend. *(US-3)*
- [x] **T134** Workout page: large title, player frame, action row, "In this session" list and swap options. *(US-3)*
- [x] **T135** Motion inside `prefers-reduced-motion: no-preference`: progress fill, press effect, dialog entrance, theme cross-fade. *(US-5)*
  Done when: e2e with `reducedMotion: 'reduce'` finds no running transitions.

**Checkpoint B:** screenshots of every screen in both themes at 360 px and 1280 px, side by side with the mockups.

## Phase 4 — Release

- [ ] **T140** Full verification: unit tests, e2e in all 6 combinations, axe-core in both themes with 0 violations, keyboard-only flow, load time under 2 s. Record results in `specs/002-ui-refresh/acceptance.md`.
- [ ] **T141** README: new screenshots in both themes, Today and theme switch in "What it does", e2e tests in "Quality", the 002 docs in the SDD table.
- [ ] **T142** Push to `main` (Vercel deploys automatically), run the e2e suite against the live URL, and ask the user to check real Safari and an iPhone.
  Done when: live e2e run is green and the user has checked Safari and iPhone.
