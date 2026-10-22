import {
  createPlan,
  expect,
  setFirstSession,
  shiftPlan,
  stored,
  test,
  todayKey,
} from './helpers.js'

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

// Real catalog videos: a high-intensity 30 min cardio HIIT and a 20 min calm practice.
const CARDIO_30 = 'zBTz636KeMA'
const CALM_20 = 'bJJWArRfKa0'

const suggestion = (page) => page.getByRole('region', { name: 'Suggestion' })
const workout = (page) => page.getByRole('region', { name: "Today's workout" })

test('low on a cardio day: swap to something gentler, then undo (003 US-2)', async ({ page }) => {
  await setFirstSession(page, 'cardio', [CARDIO_30])
  await checkIn(page).getByRole('button', { name: 'Low' }).click()
  await expect(suggestion(page)).toContainText(/gentler/i)

  await suggestion(page).getByRole('button', { name: 'Swap to this' }).click()
  await expect(suggestion(page)).toContainText(/Swapped to/i)
  const swapped = (await stored(page)).plan.sessions[0]
  expect(['calm', 'stretching', 'yoga']).toContain(swapped.category)
  await expect(workout(page)).toContainText(new RegExp(swapped.category, 'i'))

  await page.reload()
  await suggestion(page).getByRole('button', { name: 'Undo' }).click()
  await expect.poll(async () => (await stored(page)).plan.sessions[0].videoIds).toEqual([CARDIO_30])
  await expect(suggestion(page)).toContainText(/gentler/i)
})

test('ready on a calm day: keep my plan, and it stays dismissed (003 US-2)', async ({ page }) => {
  await setFirstSession(page, 'calm', [CALM_20])
  await checkIn(page).getByRole('button', { name: 'Ready' }).click()
  await expect(suggestion(page)).toContainText(/more active/i)
  await suggestion(page).getByRole('button', { name: 'Keep my plan' }).click()
  await expect(suggestion(page)).toHaveCount(0)
  await page.reload()
  await expect(suggestion(page)).toHaveCount(0)
  expect((await stored(page)).plan.sessions[0].videoIds).toEqual([CALM_20])
})

test('ready on a rest day: add a short session, then undo (003 US-2)', async ({ page }) => {
  await shiftPlan(page, -2)
  await checkIn(page).getByRole('button', { name: 'Ready' }).click()
  await expect(suggestion(page)).toContainText(/rest day/i)
  await suggestion(page).getByRole('button', { name: 'Add it' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Today's workout")
  await expect(suggestion(page)).toContainText(/Added/i)

  await suggestion(page).getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rest day')
})

test('okay, or a mood that fits, suggests nothing (003 US-2)', async ({ page }) => {
  await setFirstSession(page, 'cardio', [CARDIO_30])
  await checkIn(page).getByRole('button', { name: 'Okay' }).click()
  await expect(page.getByRole('region', { name: "Today's check-in" })).toBeVisible()
  await expect(suggestion(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Change' }).click()
  await checkIn(page).getByRole('button', { name: 'Ready' }).click()
  await expect(suggestion(page)).toHaveCount(0)
})
