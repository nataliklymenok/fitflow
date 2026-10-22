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
