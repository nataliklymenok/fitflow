import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './catalog.js'
import { allAnswerCombinations } from './quiz.js'
import { categoryWeights, isIntensityAllowed } from './weights.js'

function topTwo(weights) {
  return Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([category]) => category)
    .sort()
}

describe('categoryWeights', () => {
  it('favors Calm and Stretching/Yoga when stressed with low energy', () => {
    const weights = categoryWeights({
      mood: 'stressed',
      energy: 'low',
      goal: 'stress',
    })
    expect(topTwo(weights)).toEqual(['calm', 'yoga'])
    expect(weights.calm).toBeGreaterThan(weights.cardio * 3)
    expect(weights.stretching).toBeGreaterThan(weights.functional)
  })

  it('favors Functional and Cardio when motivated with high energy and a strength goal', () => {
    const weights = categoryWeights({
      mood: 'motivated',
      energy: 'high',
      goal: 'strength',
    })
    expect(topTwo(weights)).toEqual(['cardio', 'functional'])
    expect(weights.functional).toBeGreaterThan(weights.calm * 3)
  })

  it('favors Stretching for a flexibility goal', () => {
    const weights = categoryWeights({
      mood: 'okay',
      energy: 'medium',
      goal: 'flexibility',
    })
    expect(topTwo(weights)).toContain('stretching')
  })

  it('gives every category a weight of at least 1 for every answer combination', () => {
    for (const answers of allAnswerCombinations()) {
      const weights = categoryWeights(answers)
      expect(Object.keys(weights)).toEqual(CATEGORIES)
      for (const weight of Object.values(weights)) {
        expect(weight).toBeGreaterThanOrEqual(1)
      }
    }
  })
})

describe('isIntensityAllowed', () => {
  const video = (category, intensity) => ({ category, intensity })

  it('leaves out high-intensity videos when energy is low', () => {
    expect(isIntensityAllowed(video('cardio', 'high'), 'low')).toBe(false)
    expect(isIntensityAllowed(video('cardio', 'medium'), 'low')).toBe(true)
  })

  it('leaves out low-intensity videos when energy is high', () => {
    expect(isIntensityAllowed(video('functional', 'low'), 'high')).toBe(false)
    expect(isIntensityAllowed(video('functional', 'high'), 'high')).toBe(true)
  })

  it('allows everything when energy is medium', () => {
    for (const intensity of ['low', 'medium', 'high']) {
      expect(isIntensityAllowed(video('yoga', intensity), 'medium')).toBe(true)
    }
  })

  it('never filters out Calm or Stretching', () => {
    expect(isIntensityAllowed(video('calm', 'low'), 'high')).toBe(true)
    expect(isIntensityAllowed(video('stretching', 'low'), 'high')).toBe(true)
  })
})
