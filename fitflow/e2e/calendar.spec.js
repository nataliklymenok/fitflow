import { answerQuiz, createPlan, expect, stored, test } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await createPlan(page)
  await page.goto('/calendar')
})

test('week view shows each day with type, title and minutes (US-3)', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Week', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const card = page.locator('a[href^="/session/"]').first()
  await expect(card).toContainText(/Functional|Cardio|Stretching|Yoga|Calm/)
  await expect(card).toContainText(/\d+ min/)
  await expect(page.locator('[aria-current="date"]')).toHaveCount(1)
  await expect(page.getByText('Rest', { exact: true }).first()).toBeVisible()
})

test('month view is available (US-3)', async ({ page }) => {
  await page.getByRole('button', { name: 'Month', exact: true }).click()
  await expect(page).toHaveURL(/view=month/)
  await expect(page.locator('a[href^="/session/"]').first()).toBeVisible()
  await page.getByRole('button', { name: 'Week', exact: true }).click()
  await expect(page).not.toHaveURL(/view=month/)
})

test('Regenerate asks first and then replaces the plan (US-2)', async ({ page }) => {
  const { plan } = await stored(page)
  await page.getByRole('button', { name: /Regenerate/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  expect((await stored(page)).plan.seed).toBe(plan.seed)

  await page.getByRole('button', { name: /Regenerate/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Regenerate' }).click()
  await expect.poll(async () => (await stored(page)).plan.seed).not.toBe(plan.seed)
})

test('Retake quiz asks first and replaces the plan when finished (US-6)', async ({ page }) => {
  await page.getByRole('button', { name: 'Retake quiz' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Retake quiz' }).click()
  await expect(page).toHaveURL(/\/quiz$/)
  expect(await stored(page)).not.toBeNull()

  await answerQuiz(page, ['Motivated', 'High', 'Build strength', '5', '30 min', '1 week'])
  await expect.poll(async () => (await stored(page)).answers.goal).toBe('strength')
})

test('Reset asks first and deletes everything (US-6)', async ({ page }) => {
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Reset' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await stored(page)).toBeNull()
  await expect(page.getByRole('link', { name: 'Start the quiz' })).toBeVisible()
})

test('Escape closes a confirmation without doing anything', async ({ page }) => {
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await stored(page)).not.toBeNull()
})
