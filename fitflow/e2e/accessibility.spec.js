import AxeBuilder from '@axe-core/playwright'
import {
  coverAllCategories,
  createPlan,
  expect,
  quizAnswer,
  setFirstSession,
  test,
} from './helpers.js'

// The YouTube player is third-party content inside an iframe; it is excluded.
async function expectNoViolations(page, name) {
  // Audit the settled page: mid-animation colors are not what users read.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  )
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
      const { plan } = await createPlan(page, [
        'Okay', 'Medium', 'Get fitter / lose weight', '6', '30 min', '1 week',
      ])
      await coverAllCategories(page)

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

test('check-in, suggestion and applied states have no accessibility violations (003)', async ({ page }) => {
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((t) => localStorage.setItem('fitflow:theme', t), theme)
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('fitflow'))
    await createPlan(page)
    await setFirstSession(page, 'cardio', ['zBTz636KeMA'])
    await expectNoViolations(page, `${theme}: check-in`)
    await page
      .getByRole('group', { name: 'How do you feel today?' })
      .getByRole('button', { name: 'Low' })
      .click()
    await expectNoViolations(page, `${theme}: suggestion`)
    await page.getByRole('button', { name: 'Swap to this' }).click()
    await expectNoViolations(page, `${theme}: swapped`)
    await page.goto('/calendar')
    await expectNoViolations(page, `${theme}: calendar with mood mark`)
  }
})

test('trainers pages, choices and the quiz trainers step have no accessibility violations (004)', async ({ page }) => {
  const types = () => page.getByRole('group', { name: 'Workout types in my plan' })
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((t) => localStorage.setItem('fitflow:theme', t), theme)
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('fitflow'))

    await page.goto('/trainers')
    await expect(page.locator('img[src*="i.ytimg.com"]').first()).toBeVisible()
    await expectNoViolations(page, `${theme}: trainers`)
    await page.getByRole('button', { name: 'Select Tom Merrick' }).click()
    for (const name of ['Functional', 'Cardio', 'Stretching', 'Calm']) {
      await types().getByRole('button', { name: new RegExp(name) }).click()
    }
    await expect(page.getByRole('status')).toContainText('has no Yoga videos')
    await expectNoViolations(page, `${theme}: trainers with an error`)
    await page.getByRole('button', { name: 'Clear' }).click()
    for (const name of ['Functional', 'Cardio', 'Stretching', 'Calm']) {
      await types().getByRole('button', { name: new RegExp(name) }).click()
    }
    await page.getByRole('button', { name: 'Select Caroline Girvan' }).click()
    await page.getByRole('button', { name: 'Save my choice' }).click()
    await expect(page.getByRole('status')).toContainText('Saved')
    await expectNoViolations(page, `${theme}: trainers saved`)

    await page.goto('/trainers/olha-pasichnyk')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoViolations(page, `${theme}: trainer page`)

    await page.goto('/quiz')
    for (const label of ['Okay', 'Medium', 'Get fitter / lose weight', '4', '10 min', '1 week']) {
      await quizAnswer(page, label).click()
    }
    // The saved Caroline Girvan plus Mila Tymchuk leave two types uncovered.
    await page.getByRole('list', { name: 'Trainers' }).getByRole('button', { name: /Mila Tymchuk/ }).click()
    await expect(page.getByRole('status')).toContainText(/won't be in your plan/)
    await expectNoViolations(page, `${theme}: quiz trainers step with a warning`)
  }
})
