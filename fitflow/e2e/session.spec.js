import { createPlan, expect, stored, test } from './helpers.js'

let first

test.beforeEach(async ({ page }) => {
  const { plan } = await createPlan(page)
  first = plan.sessions[0]
})

function sessionIn(state, id) {
  return state.plan.sessions.find((session) => session.id === id)
}

test('YouTube loads only on the workout page (NFR-1)', async ({ page }) => {
  await page.goto('/calendar')
  await expect(page.locator('a[href^="/session/"]').first()).toBeVisible()
  expect(await page.locator('script[src*="youtube"]').count()).toBe(0)

  await page.locator(`a[href="/session/${first.id}"]`).click()
  await expect(page.locator('script[src*="youtube.com/iframe_api"]')).toHaveCount(1)
})

test('workout page shows an embedded player and the videos (US-4)', async ({ page }) => {
  await page.goto(`/session/${first.id}`)
  await expect(page.locator('iframe[src*="youtube-nocookie.com/embed/"]')).toBeAttached({
    timeout: 20_000,
  })
  const list = page.getByRole('region', { name: 'In this session' })
  await expect(list).toContainText(/\d+ min/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/\d+ min/)
})

test('a session can be marked done or skipped, and undone (US-4)', async ({ page }) => {
  await page.goto(`/session/${first.id}`)
  await page.getByRole('button', { name: /Mark as done/ }).click()
  await expect.poll(async () => sessionIn(await stored(page), first.id).status).toBe('done')
  await page.getByRole('button', { name: 'Undo' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect.poll(async () => sessionIn(await stored(page), first.id).status).toBe('skipped')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(async () => sessionIn(await stored(page), first.id).status).toBe('planned')
})

test('a video can be swapped for a suggestion (US-5)', async ({ page }) => {
  await page.goto(`/session/${first.id}`)
  await page.getByRole('button', { name: /^Swap / }).first().click()
  await page.getByRole('button', { name: /^Use / }).first().click()
  await expect
    .poll(async () => sessionIn(await stored(page), first.id).videoIds[0])
    .not.toBe(first.videoIds[0])
})

test('a session can change type, move (swapping days) and be deleted (US-5)', async ({ page }) => {
  const { plan } = await stored(page)
  const second = plan.sessions[1]
  const newCategory = first.category === 'cardio' ? 'calm' : 'cardio'
  await page.goto(`/session/${first.id}`)

  await page.getByRole('button', { name: /Edit session/ }).click()
  await page.getByLabel('Change workout type').selectOption(newCategory)
  await page.getByRole('button', { name: 'Change', exact: true }).click()
  await expect.poll(async () => sessionIn(await stored(page), first.id).category).toBe(newCategory)

  await page.getByRole('button', { name: /Edit session/ }).click()
  await page.getByLabel('Move to another day').selectOption(second.date)
  await page.getByRole('button', { name: 'Move', exact: true }).click()
  await expect.poll(async () => sessionIn(await stored(page), first.id).date).toBe(second.date)
  expect(sessionIn(await stored(page), second.id).date).toBe(first.date)

  await page.getByRole('button', { name: /Edit session/ }).click()
  await page.getByRole('button', { name: 'Delete session' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page).toHaveURL(/\/calendar$/)
  expect(sessionIn(await stored(page), first.id)).toBeUndefined()
})

test('a session can be added on a rest day (US-5)', async ({ page }) => {
  const before = (await stored(page)).plan.sessions.length
  await page.goto('/calendar')
  await page.getByRole('button', { name: /^Add a session on / }).first().click()
  await page.getByLabel('Workout type').selectOption('yoga')
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click()
  await expect.poll(async () => (await stored(page)).plan.sessions.length).toBe(before + 1)
})

test('an unknown session sends you back to the calendar', async ({ page }) => {
  await page.goto('/session/does-not-exist')
  await expect(page).toHaveURL(/\/calendar$/)
})
