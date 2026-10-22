import AxeBuilder from '@axe-core/playwright'
import { createPlan, expect, test } from './helpers.js'

// The YouTube player is third-party content inside an iframe; it is excluded.
async function expectNoViolations(page, name) {
  const { violations } = await new AxeBuilder({ page })
    .exclude('iframe')
    .analyze()
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )
  expect(summary, `axe violations on ${name}`).toEqual([])
}

for (const theme of ['dark', 'light']) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        (t) => localStorage.setItem('fitflow:theme', t),
        theme,
      )
    })

    test('landing and quiz have no accessibility violations (NFR-3)', async ({
      page,
    }) => {
      await page.goto('/')
      await expectNoViolations(page, 'landing')
      await page.goto('/quiz')
      await expectNoViolations(page, 'quiz')
    })

    test('today, calendar, workout page and dialogs have no accessibility violations (NFR-3)', async ({
      page,
    }) => {
      const { plan } = await createPlan(page)

      await page.goto('/today')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoViolations(page, 'today')

      await page.goto('/calendar')
      await expect(page.locator('a[href^="/session/"]').first()).toBeVisible()
      await expectNoViolations(page, 'calendar week')

      await page.goto('/calendar?view=month')
      await expect(page.locator('a[href^="/session/"]').first()).toBeVisible()
      await expectNoViolations(page, 'calendar month')

      await page.goto('/calendar')
      await page.getByRole('button', { name: 'Reset' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoViolations(page, 'confirm dialog')
      await page.keyboard.press('Escape')

      await page.goto(`/session/${plan.sessions[0].id}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoViolations(page, 'workout page')

      await page.getByRole('button', { name: /Edit session/ }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoViolations(page, 'edit dialog')
    })
  })
}
