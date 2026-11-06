# 005 — Test Automation: Acceptance

**Spec:** [spec.md](spec.md) · in progress

## Findings from the new runs

| Found by | What | Fix |
|---|---|---|
| T402, CI WebKit (Linux) | Tests that open the workout page and then leave it failed at random (about every second run, 1–3 tests): the page reported uncaught errors from YouTube's player script while closing, `Cache API operation failed: Context is stopped` and `NetworkError: A network error occurred.`, with no stack and no link to FitFlow's code. Not reproduced in 40 local WebKit runs on macOS. | Tests now use a fake YouTube player (plan: YouTube in tests, chosen by the user). Two tests tagged `@youtube` keep the real player; only there are errors that never pass through FitFlow's scripts ignored. The fake player made two new tests possible: the next video starts when one ends, and an unavailable video shows its message and a swap. |
