// The onboarding quiz (US-1). Order here is the order shown to the user.

export const QUESTIONS = [
  {
    id: 'mood',
    title: 'How are you feeling lately?',
    options: [
      { value: 'stressed', label: 'Stressed', hint: 'Wound up or anxious' },
      { value: 'tired', label: 'Tired', hint: 'Low on sleep or worn out' },
      { value: 'okay', label: 'Okay', hint: 'Nothing special either way' },
      { value: 'motivated', label: 'Motivated', hint: 'Ready to work hard' },
    ],
  },
  {
    id: 'energy',
    title: 'What is your energy level?',
    options: [
      { value: 'low', label: 'Low', hint: 'Gentle sessions' },
      { value: 'medium', label: 'Medium', hint: 'A bit of everything' },
      { value: 'high', label: 'High', hint: 'Push the pace' },
    ],
  },
  {
    id: 'goal',
    title: 'What is your main goal?',
    options: [
      { value: 'stress', label: 'Reduce stress', hint: 'Calm, yoga and gentle stretching' },
      { value: 'flexibility', label: 'Flexibility', hint: 'More stretching and mobility' },
      { value: 'fitness', label: 'Get fitter / lose weight', hint: 'Cardio and full-body workouts' },
      { value: 'strength', label: 'Build strength', hint: 'Strength-focused functional training' },
    ],
  },
  {
    id: 'daysPerWeek',
    title: 'How many days a week do you want to train?',
    options: [2, 3, 4, 5, 6].map((days) => ({
      value: days,
      label: `${days}`,
      hint: 7 - days === 1 ? '1 rest day a week' : `${7 - days} rest days a week`,
    })),
  },
  {
    id: 'sessionMinutes',
    title: 'How much time do you have per session?',
    options: [
      { value: 10, label: '10 min', hint: 'A quick boost' },
      { value: 20, label: '20 min', hint: 'Fits a lunch break' },
      { value: 30, label: '30 min', hint: 'A full session' },
      { value: 45, label: '45 min', hint: 'Longer, deeper sessions' },
    ],
  },
  {
    id: 'weeks',
    title: 'How long should your plan be?',
    options: [
      { value: 1, label: '1 week', hint: 'Try it out' },
      { value: 2, label: '2 weeks', hint: 'Build a habit' },
      { value: 4, label: '4 weeks', hint: 'A full month' },
    ],
  },
]

function isValidAnswer(question, value) {
  return question.options.some((option) => option.value === value)
}

export function isComplete(answers) {
  return (
    answers != null &&
    QUESTIONS.every((question) => isValidAnswer(question, answers[question.id]))
  )
}

// Returns the ids of questions with a missing or invalid answer.
export function validate(answers) {
  return QUESTIONS.filter(
    (question) => !isValidAnswer(question, answers?.[question.id]),
  ).map((question) => question.id)
}

// Every possible complete set of answers; used by tests.
export function allAnswerCombinations() {
  return QUESTIONS.reduce(
    (combinations, question) =>
      combinations.flatMap((partial) =>
        question.options.map((option) => ({
          ...partial,
          [question.id]: option.value,
        })),
      ),
    [{}],
  )
}
