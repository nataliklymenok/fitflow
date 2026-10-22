import { test as base, expect } from '@playwright/test'

// Every test fails if the page throws an uncaught error.
export const test = base.extend({
  page: async ({ page }, run) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await run(page)
    expect(errors, 'uncaught errors on the page').toEqual([])
  },
})

export { expect }

export const STRESSED = ['Stressed', 'Low', 'Reduce stress', '3', '20 min', '2 weeks']
export const FITNESS = ['Okay', 'Medium', 'Get fitter / lose weight', '4', '30 min', '1 week']

export async function answerQuiz(page, answers) {
  for (const answer of answers) {
    await page.getByRole('button', { name: answer, exact: true }).click()
  }
}

// Takes the quiz from the landing page and waits for the plan to be saved.
export async function createPlan(page, answers = FITNESS) {
  await page.goto('/quiz')
  await answerQuiz(page, answers)
  await expect.poll(() => stored(page)).not.toBeNull()
  return stored(page)
}

export async function stored(page) {
  const raw = await page.evaluate(() => localStorage.getItem('fitflow'))
  return raw ? JSON.parse(raw) : null
}

export async function todayKey(page) {
  return page.evaluate(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
}

export async function hasHorizontalScroll(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
}

// Moves every date of the saved plan by `days` (negative = into the past),
// then reloads, to show Today on a different day of the plan.
export async function shiftPlan(page, days) {
  await page.evaluate((offset) => {
    const pad = (n) => String(n).padStart(2, '0')
    const shift = (key) => {
      const [y, m, d] = key.split('-').map(Number)
      const date = new Date(y, m - 1, d + offset)
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    }
    const data = JSON.parse(localStorage.getItem('fitflow'))
    data.plan.startDate = shift(data.plan.startDate)
    data.plan.endDate = shift(data.plan.endDate)
    data.plan.sessions.forEach((session) => (session.date = shift(session.date)))
    localStorage.setItem('fitflow', JSON.stringify(data))
  }, days)
  await page.reload()
}
