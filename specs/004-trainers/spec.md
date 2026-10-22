# 004 — Trainers: Browse and Choose Who You Train With

**Status:** Draft · **Created:** 2026-10-22 · **Builds on:** [001](../001-workout-planner/spec.md), [002](../002-ui-refresh/spec.md), [003](../003-mood-and-progress/spec.md)

## Summary

FitFlow gets a Trainers page with about 10 YouTube trainers, grouped by what they teach: functional, cardio, stretching, yoga, calm. Before or during the quiz, a person picks the trainers their plan should come from: one favourite for everything, a mix of up to five, or any trainer. The plan, video swaps and daily suggestions then use only those trainers' videos.

## Why

- Today the plan mixes all five channels. Someone who only wants yoga and stretching still gets cardio and functional sessions, and someone who loves one trainer can't stay with them.
- People follow trainers, not categories. Choosing who you train with makes the plan feel like yours.
- More trainers, including Ukrainian ones, make the app useful to more people.

## Users

- **Loyal fan:** wants everything from one trainer, whatever the type.
- **Focused:** picks trainers who teach only what they want (for example, two yoga trainers and one stretching trainer).
- **Explorer:** doesn't care; keeps "any trainer" and gets the current behaviour.

## User stories

### P1 — must have

**US-1. Trainers page**
As a visitor, I can browse the trainers, so that I know who I could train with.

- A Trainers page, reachable from the navigation and the landing page.
- Trainers can be filtered by category (Functional, Cardio, Stretching, Yoga, Calm); a trainer appears under every category they have videos in.
- Each trainer card shows: name, a short description, the categories they cover, how many videos FitFlow has from them and their typical length range, the language of the videos, and a link to their YouTube channel.
- A trainer's own page (or expanded card) lists their videos in FitFlow.

**US-2. Choose trainers**
As a user, I can choose which trainers my plan uses: one, several (up to five), or any.

- Trainers are selected in a new quiz step ("Your trainers", default "Any trainer") and on the Trainers page, which can be opened at any time.
- At most 5 trainers can be selected; a sixth selection is refused with a short explanation.
- "Any trainer" is the default and means today's behaviour.
- The selection is remembered on this device.

**US-3. Plans follow the selection**
As a user, I only get videos from the trainers I chose.

- The generated plan uses only the selected trainers' videos.
- Workout types come from what the selected trainers teach, minus any types switched off (US-6): a user who picked only yoga and stretching trainers gets only yoga and stretching sessions, even if the quiz would otherwise add cardio.
- Within those types, the quiz still decides the mix (mood, energy, goal).
- Video swaps (001 US-4/US-5) and daily suggestions (003 US-2) also stay within the selection.

**US-4. Honest limits**
As a user, I'm told when my choice can't fill my plan well.

- If the selected trainers don't have videos close to the chosen session length, the quiz says so before the plan is created and suggests adding a trainer or picking another length.
- With a single trainer, videos may repeat more often than with "any trainer"; the plan still avoids repeats within 7 days when it can.

**US-5. Change trainers later**
As a user, I can change my trainers or workout types after the plan exists.

- After a confirmation, sessions from today onwards are rebuilt with the new choice.
- Past and done sessions, the streak and check-ins stay as they are.

**US-6. Turn workout types off**
As a user, I can switch off workout types I don't want, for example "no cardio", even with trainers who teach them.

- In the quiz step and on the Trainers page, the five types are toggles, all on by default; at least one must stay on.
- The plan uses only types that are both switched on and taught by the selected trainers. If that leaves nothing (for example, a yoga-only trainer with yoga switched off), the choice is refused with an explanation.
- Example: Pamela Reif selected, only Stretching on → stretching sessions from Pamela Reif only.

### P2 — should have

**US-7. Trainer on every session**
As a user, I see the trainer's name on each session card and on the workout page, linking to their page in FitFlow.

## Content

- About **10 trainers** in this release (20 later):
  - the current 5: Yoga With Adriene, MadFit, Heather Robertson, Pamela Reif, Tom Merrick;
  - **Caroline Girvan** (strength);
  - **at least 2–3 Ukrainian trainers** who publish follow-along workouts on YouTube (to be researched and confirmed with the user);
  - 1–2 more to fill gaps (for example, more calm or stretching).
- Every trainer needs enough videos to build a plan alone: **at least 8 videos** across their categories, with a spread of lengths (10–45 minutes), all allowing embedding (checked by `npm run check:catalog`).
- Descriptions are short, factual and written by us. No trainer photos are copied; cards use an initials avatar and link to the official channel.

## Functional requirements

- **FR-1** The catalog gains a trainers list (id, name, channel URL, language, description); every video belongs to exactly one trainer.
- **FR-2** The selection (trainers and workout types) is stored locally with the plan data (schema version 3, migrated from version 2 as "any trainer, all types").
- **FR-3** Plan generation, swap suggestions and check-in suggestions take the selection as input and stay pure functions, unit-tested with single-trainer and multi-trainer selections for every trainer.
- **FR-4** Every trainer passes a "can build a plan alone" check in tests: for each session length in the quiz, at least one of their videos (or a combination) fits within the length tolerance.

## Non-functional requirements

- Everything from 001–003 still holds: all existing tests pass, both themes, desktop and phone, axe-core 0 violations.
- The Trainers page works with the keyboard; filters and selection are real controls with accessible names and states.

## Out of scope

- Trainer accounts, ratings or reviews.
- Fetching channels or videos live from YouTube.
- Paid or members-only content.

## Success criteria

- A user can build a plan from a single trainer in under a minute.
- A "yoga and stretching only" user never sees a cardio or functional session.
- Every trainer, chosen alone, produces a valid plan for every quiz answer (automated).

## Decisions

- **Where:** both a quiz step and the Trainers page.
- **Changing the choice later** rebuilds sessions from today onwards; past and done sessions stay.
- **Workout-type toggles** in addition to choosing trainers (US-6).
- **Ukrainian trainers:** researched and proposed by Claude, approved by the user before they go into the catalog.

## Proposed trainers (to approve)

All channels below were checked on 2026-10-22: their sample videos exist and allow embedding.

| Trainer | Language | Main categories | Notes |
|---|---|---|---|
| Yoga With Adriene | English | Yoga, Calm | already in FitFlow |
| MadFit | English | Functional, Cardio, Stretching | already in FitFlow |
| Heather Robertson | English | Functional, Cardio | already in FitFlow |
| Pamela Reif | English (videos without talking) | Cardio, Stretching | already in FitFlow |
| Tom Merrick | English | Stretching | already in FitFlow; few videos with stated length, may need more |
| **Caroline Girvan** | English | Functional (strength, dumbbells) | many 20–60 min sessions |
| **Mila Tymchuk** | Ukrainian | Functional, Cardio (HIIT), Pilates | 300+ home workouts, 25–50 min |
| **Аня Лу — Фітнес для кожного** | Ukrainian | Functional, Pilates, Stretching | 15–40 min, bands and dumbbells |
| **Йога Українською** | Ukrainian | Yoga | 150+ practices, many 45–60 min |
| **Йога і медитації українською — ЙОГА ДОПОМОГА** | Ukrainian | Stretching, Yoga, Calm | short morning stretches |

Alternates if a trainer lacks enough short videos: **Move with Dasha** (yoga, Ukrainian), **Надія Винар** (yoga, Ukrainian), **Тиша — Медитації українською** (calm, Ukrainian).

Pilates is not a FitFlow category; Pilates sessions are filed under Functional (low or medium intensity).

## Open questions

- [NEEDS CLARIFICATION] Approve the trainer list above, or swap names.
