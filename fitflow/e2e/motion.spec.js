import { createPlan, expect, test } from './helpers.js'

// Animations still running right now (CSS animations and transitions).
const running = (page) => page.evaluate(() => document.getAnimations().length)

test.describe('reduced motion (002 US-5)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('nothing animates when the system asks for less motion', async ({ page }) => {
    await createPlan(page)
    await page.goto('/today')
    await expect(page.getByRole('progressbar', { name: 'Sessions done' })).toBeVisible()
    expect(await running(page)).toBe(0)

    await page.goto('/calendar')
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await running(page)).toBe(0)
  })
})

test.describe('motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('dialogs animate in', async ({ page }) => {
    await createPlan(page)
    await page.goto('/calendar')
    await page.getByRole('button', { name: 'Reset' }).click()
    expect(await running(page)).toBeGreaterThan(0)
  })
})
