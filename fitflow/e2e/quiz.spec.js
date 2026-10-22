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
  await expect(page.getByText('Question 1 of 6')).toBeVisible()
  await expect(page.getByRole('progressbar')).toBeVisible()

  await answerQuiz(page, ['Stressed'])
  await expect(page.getByText('Question 2 of 6')).toBeVisible()

  await page.getByRole('button', { name: '← Back' }).click()
  await expect(page.getByText('Question 1 of 6')).toBeVisible()
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
