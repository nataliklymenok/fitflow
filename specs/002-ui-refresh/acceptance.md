# 002 — UI Refresh: Acceptance

**Run:** 2026-10-22 · **Build:** production build served by `vite preview` · **Spec:** [spec.md](spec.md)

Unlike 001, every check below is now an automated test in the repo (`fitflow/e2e/`, run with `npm run test:e2e`), so the same run can be repeated on every change and against the live site (`BASE_URL=… npm run test:e2e`).

## Totals

| Suite | Result |
|---|---|
| Unit tests (Vitest) | 109 passed |
| End-to-end (Playwright): Chromium, Firefox and WebKit, each at 1280×900 and 390×844 | 264 passed, 12 skipped by design (desktop-only or phone-only checks) |
| Accessibility (axe-core), both themes, every page and dialog | 0 violations |
| Lint, production build | pass |

## User stories

| Criterion | How it is checked | Result |
|---|---|---|
| **US-1** With a plan, the app opens on Today; without one, on the landing page | `today.spec.js`, `persistence.spec.js` | ✅ |
| **US-1** Finishing the quiz opens Today | `quiz.spec.js` | ✅ |
| **US-1** Training day: category, title, channel, minutes, Start, Swap | `today.spec.js` | ✅ |
| **US-1** Rest day shows the next planned session | `today.spec.js` (plan dates shifted) | ✅ |
| **US-1** Plan not started yet / finished (Regenerate, Retake quiz) | `today.spec.js` | ✅ |
| **US-1** Progress: sessions done, minutes trained, progress bar | `today.spec.js` + unit tests for `planProgress` | ✅ |
| **US-1** This week, with a link to the calendar | `today.spec.js` | ✅ |
| **US-2** Desktop header nav with `aria-current` | `navigation.spec.js` | ✅ |
| **US-2** Phones: bottom tab bar, header nav hidden, nothing hidden behind the bar | `navigation.spec.js` | ✅ |
| **US-3** Every screen in the new design; all 001 behavior unchanged | all 001 checks still pass (`quiz`, `calendar`, `session`, `persistence` specs); screenshots compared with the mockups at Checkpoint B | ✅ |
| **US-3** Quiz hints, segmented progress with "N to go", landing tagline, Done badge, highlighted today | screenshots; quiz hints also by unit test | ✅ |
| **US-4** Theme switch in the header, labelled with the theme it switches to | `theme.spec.js` | ✅ |
| **US-4** First visit follows the device setting; the choice is remembered | `theme.spec.js` | ✅ |
| **US-4** Switching keeps the page as it is | `theme.spec.js` | ✅ |
| **US-5** Motion: press effect, dialog entrance, progress fill, theme cross-fade | `motion.spec.js` (animations run when motion is allowed) | ✅ |
| **US-5** Nothing animates with "reduce motion" | `motion.spec.js` | ✅ |

## Requirements

| Requirement | How it is checked | Result |
|---|---|---|
| **FR-1** Minutes trained = lengths of sessions marked done | unit tests, `today.spec.js` | ✅ |
| **FR-2** Today uses the local date | unit tests for `todayStatus`; local date keys as in 001 | ✅ |
| **FR-3** Fonts served by the app, not a font service | build output; only `/assets/*.woff2` requested | ✅ |
| **FR-4** Theme stored apart from the plan; Reset keeps it | unit tests, `theme.spec.js` | ✅ |
| **FR-5** No flash of the other theme | `theme.spec.js` loads the page with the app's JavaScript blocked and still finds the right theme | ✅ |
| **NFR-1** Accessibility in both themes; keyboard; visible focus | `accessibility.spec.js` (axe, plan covering every category), `keyboard.spec.js` (whole flow by keyboard, including WebKit with Option+Tab) | ✅ |
| **NFR-2** Contrast ≥ 4.5:1 (3:1 for large text) | axe color-contrast in both themes | ✅ |
| **NFR-3** 360 px to desktop, no sideways scrolling | `persistence.spec.js` overflow check on every page | ✅ |
| **NFR-4** First load under 2 s; fonts don't block rendering | 30–42 ms locally, 182 KB transferred; fonts use `font-display: swap`, only the 2 latin files used on the page are downloaded | ✅ (recheck on the live site) |

## Found and fixed during this release

- **Faint numbers** ("/08") were below 3:1 in both themes: raised to 3.6–3.7:1.
- **Quiz answers** had an accessible name shorter than their visible text (`label-content-name-mismatch`): the name now includes the hint.
- **Month view on today's cell**: two translucent backgrounds lowered cardio text to 3.9:1. Chips now have an opaque background; the accessibility test was made deterministic so it always covers this case.

## Not covered

- Real Safari on macOS and iOS: WebKit is Safari's engine, not Safari itself. Checked by hand after deployment (T142).
- Load time on the live site: measured after deployment (T142).
