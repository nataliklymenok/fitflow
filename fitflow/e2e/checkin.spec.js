import { createPlan, expect, shiftPlan, stored, test, todayKey } from './helpers.js'

const checkIn = (page) => page.getByRole('group', { name: 'How do you feel today?' })

test.beforeEach(async ({ page }) => {
  await createPlan(page)
})

test('the check-in is answered in one tap and survives a reload (003 US-1)', async ({ page }) => {
  await checkIn(page).getByRole('button', { name: 'Low' }).click()
  const summary = page.getByRole('region', { name: "Today's check-in" })
  await expect(summary).toContainText(/Feeling low today/i)

  const today = await todayKey(page)
  expect((await stored(page)).checkIns[today].mood).toBe('low')

  await page.reload()
  await expect(summary).toContainText(/Feeling low today/i)
})

test('the answer can be changed (003 US-1)', async ({ page }) => {
  await checkIn(page).getByRole('button', { name: 'Okay' }).click()
  await page.getByRole('button', { name: 'Change' }).click()
  await expect(checkIn(page).getByRole('button', { name: 'Okay' })).toHaveAttribute('aria-pressed', 'true')
  await checkIn(page).getByRole('button', { name: 'Ready' }).click()
  await expect(page.getByRole('region', { name: "Today's check-in" })).toContainText(/Feeling ready today/i)
})

test('the check-in shows on rest days too (003 US-1)', async ({ page }) => {
  await shiftPlan(page, -2) // day 2 of the plan is a rest day
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rest day')
  await expect(checkIn(page)).toBeVisible()
})

test('the check-in is optional: the workout can be started without it', async ({ page }) => {
  await page.getByRole('region', { name: "Today's workout" }).getByRole('link', { name: 'Start' }).click()
  await expect(page).toHaveURL(/\/session\//)
})
