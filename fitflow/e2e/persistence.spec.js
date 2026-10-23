import { readFile } from 'node:fs/promises'
import { createPlan, expect, hasHorizontalScroll, stored, test } from './helpers.js'

test('plan and edits survive a reload and a new tab (US-6)', async ({ page, context }) => {
  const { plan } = await createPlan(page)
  await page.goto(`/session/${plan.sessions[0].id}`)
  await page.getByRole('button', { name: /Mark as done/ }).click()
  const before = JSON.stringify((await stored(page)).plan)

  await page.reload()
  expect(JSON.stringify((await stored(page)).plan)).toBe(before)

  const tab = await context.newPage()
  await tab.goto('/calendar')
  await expect(tab.getByText('1 of', { exact: false })).toBeVisible()
  await tab.close()
})

test('pages that need a plan send a new visitor to the start', async ({ page }) => {
  for (const path of ['/calendar', '/session/anything', '/nowhere']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/$/)
  }
})

test('corrupted saved data starts fresh instead of crashing (FR-6)', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('fitflow', '{broken'))
  await page.goto('/calendar')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Start the quiz' })).toBeVisible()
})

test('no page scrolls sideways (NFR-2)', async ({ page }) => {
  for (const path of ['/', '/quiz']) {
    await page.goto(path)
    expect(await hasHorizontalScroll(page), path).toBe(false)
  }
  const { plan } = await createPlan(page, [
    'Okay', 'Medium', 'Get fitter / lose weight', '6', '45 min', '4 weeks',
  ])
  for (const path of ['/calendar', '/calendar?view=month', `/session/${plan.sessions[0].id}`]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle').catch(() => {})
    expect(await hasHorizontalScroll(page), path).toBe(false)
  }
})

test('a plan saved by the previous version still opens (003 FR-1)', async ({ page }) => {
  const v1 = JSON.parse(
    await readFile(new URL('../src/domain/fixtures/v1-saved-state.json', import.meta.url), 'utf8'),
  )
  // Move the fixture's plan to start today, so Today has something to show.
  const today = await page.evaluate(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  const shift = (key) => {
    const [y, m, d] = key.split('-').map(Number)
    const [ty, tm, td] = today.split('-').map(Number)
    const offset = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(2026, 9, 22)) / 864e5)
    const date = new Date(Date.UTC(y, m - 1, d + offset))
    return date.toISOString().slice(0, 10)
  }
  v1.plan.startDate = shift(v1.plan.startDate)
  v1.plan.endDate = shift(v1.plan.endDate)
  v1.plan.sessions.forEach((s) => (s.date = shift(s.date)))

  await page.goto('/')
  await page.evaluate((data) => localStorage.setItem('fitflow', JSON.stringify(data)), v1)
  await page.goto('/')
  await expect(page).toHaveURL(/\/today$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Today's workout")
  await expect(page.getByRole('group', { name: 'How do you feel today?' })).toBeVisible()

  await page.getByRole('group', { name: 'How do you feel today?' }).getByRole('button', { name: 'Okay' }).click()
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('fitflow')))
  expect(saved.version).toBe(3)
  expect(saved.preferences.trainers).toEqual([])
  expect(saved.plan.sessions[0].status).toBe('done')
  expect(Object.values(saved.checkIns)[0].mood).toBe('okay')
})
