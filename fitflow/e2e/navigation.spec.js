import { createPlan, expect, test } from './helpers.js'

const isPhone = (page) => page.viewportSize().width < 640

test.beforeEach(async ({ page }) => {
  await createPlan(page)
})

test('desktop: header nav marks the current section (002 US-2)', async ({ page }) => {
  test.skip(isPhone(page), 'desktop only')
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: 'Calendar' }).click()
  await expect(page).toHaveURL(/\/calendar$/)
  await expect(nav.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Today' })).not.toHaveAttribute('aria-current')
})

test('phones: a bottom tab bar replaces the header nav (002 US-2)', async ({ page }) => {
  test.skip(!isPhone(page), 'phones only')
  const navs = page.getByRole('navigation', { name: 'Main' })
  await expect(navs).toHaveCount(1) // the header nav is hidden
  const bar = navs.first()
  const box = await bar.boundingBox()
  expect(box.y + box.height).toBeCloseTo(page.viewportSize().height, 0)

  await expect(bar.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  await bar.getByRole('link', { name: 'Calendar' }).click()
  await expect(page).toHaveURL(/\/calendar$/)
  await expect(bar.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page')
})

test('phones: nothing is hidden behind the tab bar (002 US-2)', async ({ page }) => {
  test.skip(!isPhone(page), 'phones only')
  for (const path of ['/today', '/calendar']) {
    await page.goto(path)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const bar = await page.getByRole('navigation', { name: 'Main' }).boundingBox()
    // The content wrapper inside <main> ends where the page content ends.
    const content = await page.locator('main > div').boundingBox()
    expect(content.y + content.height, path).toBeLessThanOrEqual(bar.y)
  }
})

test('without a plan only Trainers is in the navigation (004)', async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem('fitflow'))
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Meet the trainers' })).toBeVisible()
  if (!isPhone(page)) {
    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link')).toHaveText(['Trainers'])
  }
})
