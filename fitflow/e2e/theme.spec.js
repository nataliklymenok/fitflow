import { answerQuiz, createPlan, expect, test } from './helpers.js'

const html = (page) => page.locator('html')

test.describe('first visit follows the device setting (US-4)', () => {
  test.describe('light device', () => {
    test.use({ colorScheme: 'light' })
    test('starts in the light theme', async ({ page }) => {
      await page.goto('/')
      await expect(html(page)).toHaveAttribute('data-theme', 'light')
    })
  })

  test.describe('dark device', () => {
    test.use({ colorScheme: 'dark' })
    test('starts in the dark theme', async ({ page }) => {
      await page.goto('/')
      await expect(html(page)).toHaveAttribute('data-theme', 'dark')
    })
  })
})

test('the toggle switches the theme and says what it switches to (US-4)', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  await expect(
    page.getByRole('button', { name: 'Switch to dark theme' }),
  ).toBeVisible()
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#f6f5fb',
  )
})

test('the choice survives a reload and overrides the device setting (US-4)', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
})

test('switching keeps the page as it is (US-4)', async ({ page }) => {
  await page.goto('/quiz')
  await answerQuiz(page, ['Okay'])
  await expect(page.getByText('Question 2 of 7')).toBeVisible()
  await page.getByRole('button', { name: /^Switch to / }).click()
  await expect(page.getByText('Question 2 of 7')).toBeVisible()
})

test('Reset deletes the plan but keeps the theme (FR-4)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await createPlan(page)
  await page.goto('/calendar')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Reset' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
})

test('the theme is set before the app loads, so it never flashes (FR-5)', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('fitflow:theme', 'light'))
  // Block the app bundle: only index.html's inline script can set the theme.
  await page.route('**/assets/*.js', (route) => route.abort())
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
})
