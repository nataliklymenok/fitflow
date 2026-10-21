# FitFlow

A portfolio web app built with AI assistance using spec-driven development (SDD). Read [specs/constitution.md](specs/constitution.md) first: it defines the workflow and the technical rules.

## Layout

- `specs/` — constitution and one folder per feature (`spec.md` → `plan.md` → `tasks.md`).
- `fitflow/` — the React + Vite app. Run all npm commands from here.

## Workflow

- Never write code without an approved task in a `tasks.md`. If the work needs to differ from the spec or plan, update those documents first and get them approved.
- Work through tasks in order. Tick the box in `tasks.md` when a task's "Done when" check passes, and commit with the task ID in the message (e.g. `T012: quiz questions and validation`).
- Stop at each **Checkpoint** for a review with the user.

## Commands (in `fitflow/`)

- `npm run dev` — start the dev server
- `npm test` — run unit tests (Vitest)
- `npm run lint` — ESLint
- `npm run build` — production build

## Conventions

- Domain logic lives in `src/domain/` as pure JS with no React imports, and every module has tests.
- Dates are local `YYYY-MM-DD` strings, never ISO timestamps.
- No API keys, backend or accounts. User data goes in `localStorage` through `src/domain/storage.js` only.
