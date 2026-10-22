import { readFile } from 'node:fs/promises'
import { createPlan, expect, test } from './helpers.js'

test('the plan downloads as an .ics file with one event per session (003 US-4)', async ({ page }) => {
  const { plan } = await createPlan(page)
  await page.goto('/calendar')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Add to calendar' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('fitflow-plan.ics')

  const text = await readFile(await download.path(), 'utf8')
  const lines = text.replace(/\r\n /g, '').split('\r\n')
  expect(lines[0]).toBe('BEGIN:VCALENDAR')
  expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(plan.sessions.length)

  const starts = lines
    .filter((l) => l.startsWith('DTSTART;VALUE=DATE:'))
    .map((l) => l.slice(-8))
  expect(starts).toEqual(plan.sessions.map((s) => s.date.replaceAll('-', '')).sort())
  expect(text).toContain(`/session/${plan.sessions[0].id}`)
})
