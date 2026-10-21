// The onboarding quiz (US-1). Order here is the order shown to the user.

export const QUESTIONS = [
  {
    id: 'mood',
    title: 'How are you feeling lately?',
    options: [
      { value: 'stressed', label: 'Stressed' },
      { value: 'tired', label: 'Tired' },
      { value: 'okay', label: 'Okay' },
      { value: 'motivated', label: 'Motivated' },
    ],
  },
  {
    id: 'energy',
    title: 'What is your energy level?',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  },
  {
    id: 'goal',
    title: 'What is your main goal?',
    options: [
      { value: 'stress', label: 'Reduce stress' },
      { value: 'flexibility', label: 'Flexibility' },
      { value: 'fitness', label: 'Get fitter / lose weight' },
      { value: 'strength', label: 'Build strength' },
    ],
  },
  {
    id: 'daysPerWeek',
    title: 'How many days a week do you want to train?',
    options: [2, 3, 4, 5, 6].map((days) => ({ value: days, label: `${days}` })),
  },
  {
    id: 'sessionMinutes',
    title: 'How much time do you have per session?',
    options: [10, 20, 30, 45].map((minutes) => ({
      value: minutes,
      label: `${minutes} min`,
    })),
  },
  {
    id: 'weeks',
    title: 'How long should your plan be?',
    options: [
      { value: 1, label: '1 week' },
      { value: 2, label: '2 weeks' },
      { value: 4, label: '4 weeks' },
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
