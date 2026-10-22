# 001 — Mood-based Workout Planner: Acceptance

**Run:** 2026-10-22 · **Build:** production build (`npm run build`) served by `vite preview` · **Spec:** [spec.md](spec.md)

Every acceptance criterion in the spec was checked against the running app. Browser checks were scripted with Playwright, which clicks through the UI the way a user would and then inspects the page and the saved data. Rules that cover all possible plans are checked by unit tests instead.

## Browsers

| Column | Engine | Viewport |
|---|---|---|
| Chrome | Google Chrome (installed) | desktop 1280×900, phone 390×844 |
| Firefox | Playwright Firefox | desktop 1280×900, phone 390×844 |
| WebKit | Playwright WebKit, the engine behind Safari | desktop 1280×900, phone 390×844 |

Result key: ✅ pass · ❌ fail · — not checked this way.

## User stories

| Criterion | Chrome | Firefox | WebKit | How |
|---|---|---|---|---|
| **US-1** Landing page has a clear call to start the quiz | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-1** One question per screen, tap options, progress bar, Back keeps the answer | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-1** At most 6 questions; finishing generates a plan and opens the calendar | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-2** Plan starts today, has the chosen length, sessions only on the chosen number of days per week | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser + unit tests |
| **US-2** Session length within ±5 min or ±25% | — | — | — | unit tests: all 2,880 answer combinations × 3 seeds |
| **US-2** Category mix follows the answers | — | — | — | unit tests |
| **US-2** No video repeated within 7 days when the catalog has an alternative | — | — | — | unit tests: all combinations × 3 seeds |
| **US-2** Regenerate gives a new valid plan, after confirmation (Cancel keeps the old one) | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-3** Week view by default; each day shows type, title, minutes and status, or "Rest" | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-3** Month view available | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-3** Today is highlighted | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-4** Embedded YouTube player with the video's title, channel and length | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-4** Mark a session Done or Skipped (and undo) | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-4** Unavailable video shows a message and a Swap button | ✅ — | — | — | Chrome desktop, with the catalog's IDs temporarily replaced by non-existent ones |
| **US-5** Swap a video for a suggestion from the same category | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-5** Change a session's type, move it (swapping with a busy day), delete it | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-5** Add a session on a rest day | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-5** Every change is saved immediately | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser: checked after each edit |
| **US-6** Plan and edits survive a reload and a new tab | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-6** Retake the quiz after confirmation, which replaces the plan | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |
| **US-6** Reset all data after confirmation | ✅ ✅ | ✅ ✅ | ✅ ✅ | browser |

Each cell shows desktop, then phone.

## Requirements

| Requirement | Result | How |
|---|---|---|
| **FR-1, FR-2** Catalog schema; at least 10 videos per category, 5–45 min | ✅ 76 videos, 11–20 per category | `npm run check:catalog`, unit test |
| **FR-3** Generation is deterministic for answers + seed | ✅ | unit test |
| **FR-4** Plans only use catalog videos | ✅ | unit tests: all combinations |
| **FR-5** Local storage with a schema version | ✅ | unit tests |
| **FR-6** Missing or corrupted data starts fresh without crashing | ✅ in all 6 browser runs | browser + unit tests |
| **NFR-1** First load under 2 s | ✅ 52–212 ms locally; recheck on the deployed site | browser |
| **NFR-1** YouTube player loads only when a workout is opened | ✅ in all 6 browser runs | browser |
| **NFR-2** Usable from 360 px to desktop, no horizontal scrolling | ✅ in all 6 browser runs; also 360 px in Chrome | browser |
| **NFR-3** Keyboard access and accessible labels | ✅ axe-core: 0 violations on every page and dialog; full flow done with the keyboard only (Chrome) | browser |
| **NFR-4** No API keys or secrets in the repo or bundle | ✅ | search of the repo and the built bundle |
| No JavaScript errors during the runs | ✅ in all 6 browser runs | browser |

## Success criteria

| Criterion | Result |
|---|---|
| A new visitor gets from the landing page to a calendar in under 60 s | ✅ The quiz is 6 taps; the scripted run took 0.7 s. A person reading each question should take 20–40 s. |
| 100% of generated plans pass the US-2 rules in automated tests | ✅ 8,640 plans (2,880 answer combinations × 3 seeds) |
| Works on the latest Chrome, Safari and Firefox, desktop and mobile | ✅ Chrome, Firefox and WebKit. **Still to check by hand: real Safari on macOS and iOS**, after deployment. |

## Not covered

- Real Safari and real phones. WebKit is Safari's engine but not Safari itself; check the deployed site on an iPhone and in Safari on a Mac.
- Unavailable-video handling was tested in Chrome only.
- Load time was measured locally. Recheck it on the deployed site.
