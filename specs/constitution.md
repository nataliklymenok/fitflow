# FitFlow Constitution

The rules every spec, plan and line of code in this repo follows. Change this file deliberately, not as a side effect of a feature.

_Changed 2026-10-22 (spec 002): end-to-end tests added to the testing rule._

## Purpose

FitFlow is a portfolio project built with AI assistance using spec-driven development (SDD). It has to work reliably when an interviewer opens the link, and the repo has to show a clear path from spec to plan to tasks to code.

## Workflow

1. Every feature starts as `specs/NNN-feature-name/spec.md`, which says what to build and why. It contains no implementation details.
2. Once the spec is approved, `plan.md` says how: architecture, components, data model and trade-offs.
3. Once the plan is approved, `tasks.md` lists small, ordered, verifiable steps.
4. Code is written only against approved tasks. If the code needs to differ from the spec, update the spec first.
5. Unresolved questions are marked `[NEEDS CLARIFICATION]` and must be closed before the plan is approved.

## Technical principles

- **Stack:** React + Vite (JavaScript), already scaffolded in `fitflow/`.
- **No backend, no accounts.** User data lives in the browser (`localStorage`). The app has to work with storage empty or unavailable.
- **No runtime API keys.** Videos come from a curated, versioned JSON catalog in the repo. YouTube is used only through its standard embedded player.
- **Deterministic logic.** Plan generation is a pure function of quiz answers, the catalog and a seed, so it is unit-testable.
- **Testing:** Vitest for domain logic (plan generation, schedule editing, storage). Playwright end-to-end tests for user flows and accessibility (axe-core) in Chromium, Firefox and WebKit, at desktop and phone sizes. Real Safari and real phones are still checked by hand before a release.
- **Quality bar:** responsive from 360px phones to desktop, keyboard accessible, `npm run lint` and `npm run build` pass.
- **Deploy:** Vercel, auto-deployed from the `main` branch.
- **Language:** UI, specs and code are in English.

## Out of bounds (unless a spec changes this)

- User accounts, sync between devices, payments.
- Scraping YouTube or downloading videos.
- Medical or nutrition advice.
