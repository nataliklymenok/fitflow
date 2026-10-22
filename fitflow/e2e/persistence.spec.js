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
