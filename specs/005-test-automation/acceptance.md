# 005 — Test Automation: Acceptance

**Spec:** [spec.md](spec.md) · in progress

## Findings from the new runs

| Found by | What | Fix |
|---|---|---|
| T402, CI WebKit (Linux) | "plan and edits survive a reload" failed once and passed on retry: the page reported an uncaught `Cache API operation failed: Context is stopped` while reloading the workout page. It has no stack or URL; FitFlow doesn't use the Cache API, so it comes from the YouTube player script as WebKit tears the page down. Not reproduced in 40 local WebKit runs on macOS. | The "no uncaught errors" check ignores exactly this error (name and message); every other page error still fails a test. |
