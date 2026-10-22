import { createPlan, expect, shiftPlan, stored, test } from './helpers.js'

// createPlan uses the FITNESS answers: 4 days a week on days 0, 1, 3 and 5.
test.beforeEach(async ({ page }) => {
  await createPlan(page)
  await expect(page).toHaveURL(/\/today$/)
})

const heading = (page) => page.getByRole('heading', { level: 1 })

test('a training day shows the workout with Start and Swap (002 US-1)', async ({ page }) => {
  await expect(heading(page)).toHaveText("Today's workout")
  const card = page.getByRole('region', { name: "Today's workout" })
  await expect(card).toContainText(/\d+ min/i)

  const { plan } = await stored(page)
  const before = plan.sessions[0].videoIds[0]
  await card.getByRole('button', { name: 'Swap video' }).click()
  await card.getByRole('button', { name: /^Use / }).first().click()
  await expect.poll(async () => (await stored(page)).plan.sessions[0].videoIds[0]).not.toBe(before)

  await card.getByRole('link', { name: 'Start' }).click()
  await expect(page).toHaveURL(new RegExp(`/session/${plan.sessions[0].id}$`))
})

test('progress counts done sessions and their minutes (002 FR-1)', async ({ page }) => {
  const progress = page.getByRole('region', { name: 'Plan progress' })
  await expect(progress).toContainText('00/04')
  const { plan } = await stored(page)
  await page.goto(`/session/${plan.sessions[0].id}`)
  await page.getByRole('button', { name: /Mark as done/ }).click()
  await page.goto('/today')
  await expect(progress).toContainText('01/04')
  await expect(page.getByRole('progressbar', { name: 'Sessions done' })).toHaveAttribute(
    'aria-valuenow',
    '1',
  )
})

test('a rest day says so and points to the next workout (002 US-1)', async ({ page }) => {
  // FITNESS uses days 0, 1, 3, 5: shifting by -2 makes today day 2, a rest day.
  await shiftPlan(page, -2)
  await expect(heading(page)).toHaveText('Rest day')
  const next = page.getByRole('region', { name: 'Next workout' }).getByRole('link')
  await expect(next).toContainText(/Next up/i)
  await next.click()
  await expect(page).toHaveURL(/\/session\//)
})

test('before the plan starts, Today shows when it starts (002 US-1)', async ({ page }) => {
  await shiftPlan(page, 3)
  await expect(heading(page)).toHaveText('Starting soon')
  await expect(page.getByRole('region', { name: 'Next workout' })).toContainText(
    'Your plan starts on',
  )
})

test('after the plan ends, Today offers a new plan (002 US-1)', async ({ page }) => {
  await shiftPlan(page, -30)
  await expect(heading(page)).toHaveText('Plan complete')
  await page.getByRole('button', { name: /Regenerate/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Regenerate' }).click()
  await expect(heading(page)).toHaveText("Today's workout")
})

test('opening the app with a plan goes to Today (002 US-1)', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/today$/)
})

test('the week overview links to the full calendar', async ({ page }) => {
  await page.getByRole('link', { name: 'Full calendar' }).click()
  await expect(page).toHaveURL(/\/calendar$/)
})

test('streak and this week update after a workout (003 US-3)', async ({ page }) => {
  const progress = page.getByRole('region', { name: 'Plan progress' })
  await expect(progress).toContainText(/Finish a workout to start one/i)
  const weekBefore = await progress.getByText(/min trained$/).first().textContent()

  const { plan } = await stored(page)
  await page.goto(`/session/${plan.sessions[0].id}`)
  await page.getByRole('button', { name: /Mark as done/ }).click()
  await page.goto('/today')

  await expect(progress).toContainText(/1\s*day/i)
  await expect(progress).not.toContainText(/Finish a workout/i)
  const weekAfter = await progress.getByText(/min trained$/).first().textContent()
  expect(weekAfter).not.toBe(weekBefore)
})
