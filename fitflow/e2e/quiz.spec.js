import {
  STRESSED,
  answerQuiz,
  expect,
  quizAnswer,
  stored,
  test,
  todayKey,
} from './helpers.js'

test('landing page has a clear call to start the quiz (US-1)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Start the quiz' })).toBeVisible()
})

test('quiz shows one question at a time with progress and Back (US-1)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Start the quiz' }).click()
  await expect(page.getByText('Question 1 of 7')).toBeVisible()
  await expect(page.getByRole('progressbar')).toBeVisible()

  await answerQuiz(page, ['Stressed'])
  await expect(page.getByText('Question 2 of 7')).toBeVisible()

  await page.getByRole('button', { name: '← Back' }).click()
  await expect(page.getByText('Question 1 of 7')).toBeVisible()
  await expect(quizAnswer(page, 'Stressed')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('finishing the quiz creates a plan from today and opens Today (US-1, US-2; 002 US-1)', async ({ page }) => {
  await page.goto('/quiz')
  await answerQuiz(page, STRESSED)
  await expect(page).toHaveURL(/\/today$/)

  const { plan, answers } = await stored(page)
  const today = await todayKey(page)
  expect(answers.goal).toBe('stress')
  expect(plan.startDate).toBe(today)
  expect(plan.sessions[0].date).toBe(today)
  expect(plan.sessions).toHaveLength(3 * 2)
})

test('the last step chooses trainers; a single-trainer plan uses only them (004 US-2, US-3)', async ({ page }) => {
  await page.goto('/quiz')
  for (const label of ['Okay', 'Medium', 'Get fitter / lose weight', '4', '20 min', '1 week']) {
    await quizAnswer(page, label).click()
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Who do you want to train with?')
  await expect(page.getByText('Question 7 of 7')).toBeVisible()
  await page.getByRole('list', { name: 'Trainers' }).getByRole('button', { name: /Caroline Girvan/ }).click()
  await page.getByRole('button', { name: 'Create my plan' }).click()
  await expect(page).toHaveURL(/\/today$/)

  const { plan, preferences } = await stored(page)
  expect(preferences.trainers).toEqual(['caroline-girvan'])
  for (const session of plan.sessions) {
    expect(['functional', 'cardio']).toContain(session.category)
  }
})

test('the trainers step warns when nothing fits the chosen length (004 US-4)', async ({ page }) => {
  await page.goto('/quiz')
  for (const label of ['Okay', 'Medium', 'Get fitter / lose weight', '4', '10 min', '1 week']) {
    await quizAnswer(page, label).click()
  }
  await page.getByRole('list', { name: 'Trainers' }).getByRole('button', { name: /Mila Tymchuk/ }).click()
  await expect(page.getByRole('status')).toContainText(/no videos that fit 10-minute sessions/)
  await expect(page.getByRole('button', { name: 'Create my plan' })).toBeDisabled()

  await page.getByRole('list', { name: 'Trainers' }).getByRole('button', { name: /Аня Лу/ }).click()
  await expect(page.getByRole('button', { name: 'Create my plan' })).toBeEnabled()

  // Selected trainers look selected, not only to screen readers.
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  )
  const chosen = page.getByRole('list', { name: 'Trainers' }).getByRole('button', { name: /Аня Лу/ })
  await page.mouse.move(0, 0)
  await expect(chosen).toHaveCSS('border-color', hexToRgb(accent))
})

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`
}
