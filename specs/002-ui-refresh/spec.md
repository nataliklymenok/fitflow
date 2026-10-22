# 002 — UI Refresh: "Night Training" + light theme

**Status:** Draft — all questions answered, waiting for approval · **Created:** 2026-10-22 · **Builds on:** [001](../001-workout-planner/spec.md)

## Summary

FitFlow gets a modern, sporty look: a bold condensed display font, large numbers and one strong accent, in two themes. The dark theme follows direction **B · Night Training**; the light theme takes its colors and soft shapes from direction **A · Soft Glow**. A new **Today** screen becomes the home of a returning user, so the next workout is one tap away. Nothing the app can do today is removed or changed in behavior.

Visual reference: the [UI directions canvas](https://claude.ai/artifact/5XuEQLh8ThpgJtcHiPpPKF).

## Why

- The current UI is clean but generic. For a portfolio piece, a distinctive and confident look makes a stronger first impression in the first few seconds.
- After the quiz, users land on a full calendar, even though the question they have is usually "what do I do today?"

## Design language

Both themes share layout, typography and components. Only the tokens below change.

| Element | Dark ("Night Training", from B) | Light ("Soft Glow", from A) |
|---|---|---|
| Background / surface | `#0C0E0D` / `#161A18` | `#F6F5FB` / `#FFFFFF` |
| Border | `#262B28`, 1 px | `#E4E2EE`, 1 px |
| Text / muted text | `#F2F5F3` / `#9AA39E` | `#17152A` / `#5E5A73` |
| Accent | lime `#C8F031`, near-black text on it | indigo `#5B4CF0`, white text on it |
| Category colors | bright: Functional `#FF8A3D` · Cardio `#FF4D6D` · Stretching `#B18CFF` · Yoga `#3DDBB0` · Calm `#5AA9FF` | deep text on pastel tints: Functional `#9A3412` · Cardio `#B4123C` · Stretching `#6D28D9` · Yoga `#0F6B5C` · Calm `#1D4ED8` |
| Shapes | 10–18 px corners, borders instead of shadows | 20–28 px corners, soft shadows |

Shared by both themes:

| Element | Choice |
|---|---|
| Display type | Barlow Condensed, bold, uppercase: headings, big numbers, buttons |
| Body type | Inter |
| Numbers | Stats shown large ("02/08", "30 MIN") |

Exact values may be adjusted in the plan to meet contrast requirements (NFR-2).

## User stories

### P1 — must have

**US-1. Today screen**
As a returning user, I see today's workout first, so that I can start it right away.

- With a plan, the app opens on Today. Without a plan, it opens on the landing page as before.
- On a training day, Today shows the session big: category, title, channel, total minutes, a **Start** button (opens the workout page) and a **Swap** button.
- On a rest day it says so, and shows the next planned session with its day.
- After the last day of the plan, it says the plan is finished and offers **Regenerate** and **Retake quiz**.
- It shows plan progress: sessions done out of total, minutes trained (the total length of sessions marked done), and a progress bar.
- It shows the current week as seven tiles, the same information as the week view, with a link to the full calendar.

**US-2. Navigation**
As a user, I can always reach Today and the Calendar.

- Desktop: top navigation with Today, Calendar and Retake quiz.
- Phones (narrower than 640 px): a bottom tab bar with Today and Calendar, so that the main actions are within thumb reach.
- The current section is marked visually and for screen readers (`aria-current`).

**US-3. Restyle every screen**
As a user, every screen looks like one consistent product.

- Landing, quiz, calendar (week and month), workout page, and all dialogs use the new design language.
- All behavior from spec 001 stays the same: every 001 acceptance check still passes, with only button labels updated where the new copy differs.

**US-4. Light and dark theme**
As a user, I can switch between a dark and a light theme.

- A theme switch in the header, on every screen, with an accessible name that says which theme it switches to.
- On the first visit, the theme follows the device setting (light or dark mode).
- My choice is remembered on this device and survives reloads.
- Switching does not reload the page or lose anything on screen.

### P2 — should have

**US-5. Motion**
Small transitions make the app feel alive: a progress bar that fills, quiz options that respond to taps, dialogs that fade in. With "reduce motion" switched on in the system, these are turned off.

## Functional requirements

- **FR-1** Minutes trained = the sum of the lengths of all sessions with status "done".
- **FR-2** Today is computed from the device's local date, like the rest of the app.
- **FR-3** Fonts are served from the app itself, not loaded from a third-party font service at runtime.
- **FR-4** The theme preference is stored locally, apart from the plan, so that Reset (which deletes the plan) does not change the theme.
- **FR-5** The page is painted in the right theme from the first frame, with no flash of the other theme on load.

## Non-functional requirements

- **NFR-1** Accessibility stays at the 001 level, in both themes: axe-core reports 0 violations on every screen and dialog, the full flow works with the keyboard, focus is clearly visible.
- **NFR-2** Text contrast at least 4.5:1, including muted text and text on category colors.
- **NFR-3** Responsive from 360 px phones to desktop with no horizontal scrolling.
- **NFR-4** First load stays under 2 seconds; fonts must not block the first render.

## Out of scope

- The daily mood check-in, streaks and other stats beyond FR-1: spec 003.
- Any change to plan generation, editing or storage.

## Success criteria

- All 001 acceptance checks pass in Chrome, Firefox and WebKit on desktop and phone.
- A returning user starts today's workout in one tap from opening the app.
- axe-core: 0 violations, in both themes.

## Decisions

- **Today is the home screen** for users with a plan (US-1).
- **Bottom tab bar on phones** (US-2).
- **Light theme in this release**, with a switch (US-4); dark is B, light takes A's colors and shapes.
- **Mockups first:** the remaining screens are drawn in both themes on the canvas and reviewed before the plan is approved.
