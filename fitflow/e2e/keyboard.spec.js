import { expect, stored, test } from './helpers.js'

// WebKit on macOS, like Safari by default, moves to links only with Option+Tab.
const tabKey = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

// Presses Tab until the focused element's visible text (or aria-label)
// matches `name`.
async function tabTo(page, name, { back = false, max = 60 } = {}) {
  const tab = tabKey(page.context().browser().browserType().name())
  const key = back ? `Shift+${tab}` : tab
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key)
    const text = await page.evaluate(() => {
      const el = document.activeElement
      return (el.getAttribute('aria-label') || el.innerText || '').trim()
    })
    // innerText is shown in capitals (CSS text-transform), so ignore case.
    if (new RegExp(name.source, 'i').test(text)) return
  }
  throw new Error(`Could not reach ${name} with Tab`)
}

test('the whole flow works with the keyboard alone (NFR-3)', async ({ page }) => {
  test.skip(page.viewportSize().width < 640, 'desktop keyboard flow')
  await page.goto('/')
  await tabTo(page, /^Start the quiz/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/quiz$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()

  for (const label of ['Okay', 'Medium', 'Flexibility', '3', '20 min', '1 week']) {
    await tabTo(page, new RegExp(`^${label}(\\s|$)`))
    await page.keyboard.press('Enter')
  }
  await expect(page).toHaveURL(/\/today$/)

  await tabTo(page, /^Start$/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/session\//)
  // Let the YouTube player load first, so it cannot take focus mid-way.
  await expect(page.locator('iframe')).toBeAttached({ timeout: 20_000 })

  await tabTo(page, /Edit session/)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('button', { name: /Edit session/ })).toBeFocused()

  // "Mark as done" comes before "Edit session", so go back.
  await tabTo(page, /Mark as done/, { back: true })
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await stored(page)).plan.sessions[0].status).toBe('done')

  await tabTo(page, /^Switch to (light|dark) theme$/, { back: true })
  const before = await page.locator('html').getAttribute('data-theme')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', before)
})

test('focus is always visible', async ({ page, browserName }) => {
  await page.goto('/')
  await page.keyboard.press(tabKey(browserName))
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
  expect(outline).not.toBe('none')
})
