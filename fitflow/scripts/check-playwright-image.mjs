// The CI container's browsers must match the installed @playwright/test,
// or Playwright refuses to start them (spec 005, plan: Tools and versions).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const installed = require('@playwright/test/package.json').version
const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')
const images = [...workflow.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)/g)].map((m) => m[1])

const wrong = images.filter((version) => version !== installed)
if (images.length === 0 || wrong.length > 0) {
  console.error(`Playwright image versions ${images.join(', ') || '(none)'} don't match @playwright/test ${installed}`)
  process.exit(1)
}
console.log(`Playwright image: OK (${installed})`)
