import { createPlan, expect, stored, test } from './helpers.js'

const card = (page, name) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name, exact: true }) })
const select = (page, name) => page.getByRole('button', { name: `Select ${name}` })
const types = (page) => page.getByRole('group', { name: 'Workout types in my plan' })
const save = (page) => page.getByRole('button', { name: 'Save my choice' })

test('the page lists trainers and filters them by type (004 US-1)', async ({ page }) => {
  await page.goto('/trainers')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainers')
  await expect(card(page, 'Caroline Girvan')).toContainText(/\d+ videos/)
  await expect(card(page, 'Tom Merrick').getByRole('link', { name: /on YouTube/ })).toHaveAttribute(
    'href',
    'https://www.youtube.com/@BodyweightWarrior',
  )

  await page.getByRole('group', { name: 'Show trainers who teach' }).getByRole('button', { name: 'Yoga' }).click()
  await expect(card(page, 'Yoga With Adriene')).toBeVisible()
  await expect(card(page, 'Caroline Girvan')).toHaveCount(0)
})

test('up to 5 trainers can be selected, and cleared (004 US-2)', async ({ page }) => {
  await page.goto('/trainers')
  await expect(page.getByRole('region', { name: 'Your choice' })).toContainText('Any trainer')
  for (const name of ['MadFit', 'Pamela Reif', 'Tom Merrick', 'Caroline Girvan', 'Mila Tymchuk']) {
    await select(page, name).click()
  }
  await expect(page.getByRole('region', { name: 'Your choice' })).toContainText('5 of 5 selected')
  await select(page, 'Аня Лу').click()
  await expect(select(page, 'Аня Лу')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('status')).toContainText(/up to 5 trainers/)

  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(page.getByRole('region', { name: 'Your choice' })).toContainText('Any trainer')
})

test('workout types can be switched off, but not all (004 US-6)', async ({ page }) => {
  await page.goto('/trainers')
  for (const name of ['Functional', 'Cardio', 'Stretching', 'Yoga']) {
    await types(page).getByRole('button', { name: new RegExp(name) }).click()
  }
  await types(page).getByRole('button', { name: /Calm/ }).click()
  await expect(types(page).getByRole('button', { name: /Calm/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('status')).toContainText(/at least one workout type/)
})

test('a choice that leaves nothing cannot be saved (004 US-6)', async ({ page }) => {
  await page.goto('/trainers')
  await select(page, 'Tom Merrick').click()
  for (const name of ['Functional', 'Cardio', 'Stretching', 'Calm']) {
    await types(page).getByRole('button', { name: new RegExp(name) }).click()
  }
  await expect(page.getByRole('status')).toContainText('Tom Merrick has no Yoga videos.')
  await expect(save(page)).toBeDisabled()
})

test('saving rebuilds sessions from today and keeps done ones (004 US-5)', async ({ page }) => {
  const { plan } = await createPlan(page)
  const first = plan.sessions[0]
  await page.goto(`/session/${first.id}`)
  await page.getByRole('button', { name: /Mark as done/ }).click()

  await page.goto('/trainers')
  await select(page, 'Caroline Girvan').click()
  await save(page).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Update plan' }).click()
  await expect(page.getByRole('status')).toContainText(/Saved/)

  const saved = await stored(page)
  expect(saved.preferences.trainers).toEqual(['caroline-girvan'])
  const kept = saved.plan.sessions.find((s) => s.id === first.id)
  expect(kept.status).toBe('done')
  expect(kept.videoIds).toEqual(first.videoIds)
  const rebuilt = saved.plan.sessions.filter((s) => s.status === 'planned')
  expect(rebuilt.length).toBeGreaterThan(0)
  expect(rebuilt.every((s) => s.id !== first.id && s.category !== 'yoga')).toBe(true)
})

test('without a plan, the choice is saved for the next plan', async ({ page }) => {
  await page.goto('/trainers')
  await select(page, 'Аня Лу').click()
  await save(page).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText(/next plan/)
  expect((await stored(page)).preferences.trainers).toEqual(['ania-lu'])
})

test("a trainer's page lists their videos by type (004 US-1)", async ({ page }) => {
  await page.goto('/trainers')
  await page.getByRole('link', { name: 'Аня Лу', exact: true }).click()
  await expect(page).toHaveURL(/\/trainers\/ania-lu$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Аня Лу')
  await expect(page.getByRole('heading', { level: 2, name: 'Functional' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Stretching' })).toBeVisible()
  await expect(page.locator('a[href*="youtube.com/watch?v="]')).toHaveCount(10)

  await page.goto('/trainers/nobody')
  await expect(page).toHaveURL(/\/trainers$/)
})
