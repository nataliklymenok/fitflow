# 002 — UI Refresh: Implementation Plan

**Status:** Approved · **Spec:** [spec.md](spec.md) · **Mockups:** [canvas, page "002 · Screens"](https://claude.ai/artifact/5XuEQLh8ThpgJtcHiPpPKF) · **Created:** 2026-10-22

## Overview

The refresh is mostly CSS. Every color, radius and shadow becomes a **semantic token** (`--bg`, `--surface`, `--accent`…) defined twice, once per theme, and selected by `data-theme` on `<html>`. Components only use tokens, so they need no theme logic. New behavior is small and lives where the rest of the logic lives: progress and "what's today" in `src/domain/` (unit-tested), theme preference in `storage.js`.

```
index.html ── inline script sets <html data-theme> before first paint (FR-5)
   │
ThemeProvider ── theme state, toggle, save ──▶ storage.js (key "fitflow:theme", FR-4)
   │
tokens.css ── :root[data-theme="dark"] { … }   :root[data-theme="light"] { … }
   │
components ── var(--surface), var(--accent), var(--cat), …
```

## Dependencies

| Need | Choice | Why |
|---|---|---|
| Display font | `@fontsource/barlow-condensed` (600, 700, 800, latin subset) | Self-hosted (FR-3), bundled by Vite, `font-display: swap` (NFR-4) |
| Body font | `@fontsource-variable/inter` (latin subset) | One variable file instead of four weights |
| End-to-end tests | `@playwright/test` (dev only) | See Testing: the 001 acceptance run becomes a repeatable test suite in the repo |

## Design tokens

`src/styles/tokens.css` is rewritten. Shared tokens (spacing, type scale, fonts) stay on `:root`; theme tokens live in two blocks:

| Token | Dark | Light |
|---|---|---|
| `--bg` / `--surface` / `--surface-2` | `#0C0E0D` / `#161A18` / `#1D2220` | `#F6F5FB` / `#FFFFFF` / `#F0EFF7` |
| `--border` | `#262B28` | `#E4E2EE` |
| `--text` / `--text-muted` | `#F2F5F3` / `#9AA39E` | `#17152A` / `#5E5A73` |
| `--accent` / `--on-accent` | `#C8F031` / `#0C0E0D` | `#5B4CF0` / `#FFFFFF` |
| `--accent-text` (links, active tab) | `#C8F031` | `#4A3BD6` |
| `--accent-soft` (selected option, today) | lime at 8% | `#EEEBFF` |
| `--radius` / `--radius-lg` / `--shadow` | 12px / 18px / none | 16px / 26px / soft shadow |
| `--focus` | lime | indigo |

**Category colors** per theme: `--cat-<name>` (text and bars), `--cat-<name>-soft` (chip background), `--cat-<name>-solid` and `--cat-<name>-on-solid` (the big block on Today). A helper `categoryVars(category)` returns `{ '--cat': …, '--cat-soft': …, … }` for inline `style`, so components write `color: var(--cat)` once for every category.

`color-scheme: dark` / `light` is set per theme, so native controls (the `<select>` in the editors, scrollbars) match.

## Theme switching (US-4, FR-4, FR-5)

- **`storage.js`** gains `loadTheme()` / `saveTheme(theme)` under a separate key `fitflow:theme`. `clear()` (Reset) does not touch it (FR-4). Tests for both, including unavailable storage.
- **`index.html`** gets a tiny inline script (before CSS): read `fitflow:theme`, else `matchMedia('(prefers-color-scheme: dark)')`, then set `document.documentElement.dataset.theme`. This is the one place that reads storage outside `storage.js`, because it must run before React loads; the key name is shared through a comment and a unit test that checks both use the same key.
- **`ThemeProvider`** (`state/ThemeProvider.jsx` + `useTheme()`): reads the attribute the script set, toggles it, saves the choice, and updates `<meta name="theme-color">`.
- **`ThemeToggle`** button in the header: sun icon in dark theme, moon in light; `aria-label` "Switch to light theme" / "Switch to dark theme".

## Today screen (US-1, FR-1, FR-2)

New pure module **`domain/today.js`**:

| Function | Returns |
|---|---|
| `todayStatus(plan, today)` | `{ kind: 'training', session }`, `{ kind: 'rest', next }` (next planned session or null), `{ kind: 'finished' }` after `endDate`, or `{ kind: 'upcoming', next }` before `startDate` |
| `planProgress(plan, minutesOf)` | `{ done, total, minutesDone, fraction }`; minutes count only sessions with status `done` (FR-1) |

Both get unit tests (training day, rest day with and without a next session, last day, after the end, all done, nothing done).

**`pages/TodayPage.jsx`** at `/today`, behind `RequirePlan`:
- hero card: category block with big minutes, title, channel, **Start** (link to `/session/:id`) and **Swap** (opens the same swap options as the workout page: the `SwapOptions` component moves to `components/`);
- rest / finished / upcoming states as in the spec;
- progress tiles: sessions, minutes, progress bar;
- "This week": the existing `WeekView` with a new `compact` prop (no "+ Add", shorter tiles), plus a link to `/calendar`.

**Routing changes:** `/` with a plan redirects to `/today`; the quiz finishes on `/today`; deleting a session from the editor still returns to `/calendar`; the workout page's back link reads "Back to calendar" as before.

## Navigation (US-2)

- **Header** (`Layout`): logo, desktop nav with `NavLink`s **Today** and **Calendar** (React Router sets `aria-current="page"`), and `ThemeToggle`. Retake quiz stays among the calendar's actions, where its confirmation already lives; a nav link that opens a dialog would be surprising.
- **`BottomTabBar`**: the same two links with icons, fixed to the bottom, shown only below 640 px and only when a plan exists. The header nav hides below 640 px. `main` gets bottom padding of the bar's height plus `env(safe-area-inset-bottom)` so nothing is hidden behind it on iPhones.

## Restyle (US-3)

Order matters little, because tokens do most of the work; each step is one task and one commit:

1. `index.css` + `ui.module.css`: fonts, base colors, buttons (condensed uppercase labels via CSS `text-transform`, so accessible names and test selectors keep their sentence-case text), chips, cards, focus ring.
2. `Layout`, `Dialog`, `ConfirmDialog`, `SessionEditor`, `AddSessionDialog`.
3. Landing: tagline, huge two-tone headline, numbered steps.
4. Quiz: segmented progress with "N to go", option tiles with hints (`hint` added to each option in `domain/quiz.js`).
5. Calendar: header actions, period nav, segmented Week/Month, day cells with top-colored session cards and the Done badge, month view.
6. Workout page: large title, player frame, action row, "In this session" list.

## Motion (US-5, P2)

CSS only, all inside `@media (prefers-reduced-motion: no-preference)`: progress bar width transition, a short press effect on quiz options and buttons, dialog fade and rise (`@starting-style`), and the theme change cross-fading background colors.

## Testing

- **Unit (Vitest):** `today.js`, theme storage, quiz hints present for every option. The existing 94 tests must keep passing untouched, except the quiz test that checks the option shape.
- **End-to-end (new, Playwright):** the acceptance script from 001 moves into the repo as `fitflow/e2e/`, runs against `vite preview` in Chromium, Firefox and WebKit at desktop and phone sizes, and gains checks for 002: Today states, tab bar on phones, theme toggle (persists, survives Reset, no flash on reload), and axe-core in both themes. `npm run test:e2e`. This updates the constitution's testing rule, which currently says UI is checked by hand.
- **Visual check:** screenshots of every screen in both themes at 360 px and 1280 px, compared with the mockups at the checkpoint.

## Constitution change

Testing line becomes: "Vitest for domain logic; Playwright end-to-end tests for user flows and accessibility (axe-core) in Chromium, Firefox and WebKit."

## Risks

| Risk | Mitigation |
|---|---|
| Lime accent is unreadable as text on the light theme | Light theme uses indigo; lime only exists in the dark tokens |
| Category colors fail contrast in one theme | Separate category tokens per theme; axe-core in both themes in e2e |
| Theme flashes on load | Inline script sets the theme before CSS loads; e2e checks the attribute before React mounts |
| Fonts slow the first render | Latin subsets only, `font-display: swap`, measured against NFR-4 |
| Bottom bar covers content or the iPhone home indicator | Padding plus `safe-area-inset-bottom`; screenshot check at 360 px |
| Restyle silently breaks a 001 behavior | All 001 acceptance checks run as e2e tests before and after |

## Spec traceability

| Spec item | Where |
|---|---|
| US-1, FR-1, FR-2 | `domain/today.js`, `TodayPage`, routing changes |
| US-2 | `Layout`, `BottomTabBar` |
| US-3 | tokens, `ui.module.css`, every page and dialog |
| US-4, FR-4, FR-5 | `index.html` script, `ThemeProvider`, `ThemeToggle`, `storage.js` |
| US-5 | motion CSS |
| FR-3, NFR-4 | `@fontsource` packages |
| NFR-1, NFR-2, NFR-3 | e2e: axe-core in both themes, keyboard flow, overflow checks |
