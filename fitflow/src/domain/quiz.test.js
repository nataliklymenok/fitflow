import { describe, expect, it } from 'vitest'
import { QUESTIONS, allAnswerCombinations, isComplete, validate } from './quiz.js'

const validAnswers = {
  mood: 'stressed',
  energy: 'low',
  goal: 'stress',
  daysPerWeek: 3,
  sessionMinutes: 20,
  weeks: 2,
}

describe('QUESTIONS', () => {
  it('has at most 6 questions, each with options (US-1)', () => {
    expect(QUESTIONS.length).toBeLessThanOrEqual(6)
    for (const question of QUESTIONS) {
      expect(question.options.length).toBeGreaterThan(1)
    }
  })
})

describe('isComplete and validate', () => {
  it('accepts a full set of valid answers', () => {
    expect(isComplete(validAnswers)).toBe(true)
    expect(validate(validAnswers)).toEqual([])
  })

  it('reports missing answers', () => {
    const partial = { ...validAnswers, goal: undefined }
    expect(isComplete(partial)).toBe(false)
    expect(validate(partial)).toEqual(['goal'])
  })

  it('reports values that are not one of the options', () => {
    const answers = { ...validAnswers, daysPerWeek: 7, energy: 'extreme' }
    expect(isComplete(answers)).toBe(false)
    expect(validate(answers)).toEqual(['energy', 'daysPerWeek'])
  })

  it('rejects numbers given as strings', () => {
    expect(isComplete({ ...validAnswers, weeks: '2' })).toBe(false)
  })

  it('handles null and undefined', () => {
    expect(isComplete(null)).toBe(false)
    expect(validate(undefined)).toHaveLength(QUESTIONS.length)
  })
})

describe('allAnswerCombinations', () => {
  it('covers every combination, all valid', () => {
    const combinations = allAnswerCombinations()
    expect(combinations).toHaveLength(4 * 3 * 4 * 5 * 4 * 3)
    expect(combinations.every(isComplete)).toBe(true)
  })
})
