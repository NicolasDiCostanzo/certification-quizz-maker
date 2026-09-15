/**
 * A deterministic 4-question quiz: filtering the DVA-C02 bank down to topic
 * "Deployment" + theme group "services" containing both "codecommit" and "ec2"
 * (match all) isolates exactly these 4 questions, in this order. Combined with a
 * pinned RNG (see helpers/quiz.ts `pinDeterministicShuffle`), the sampled quiz
 * session always contains these questions in this order.
 */
export const certCode = 'DVA-C02'
export const certExamName = 'AWS Certified Developer - Associate'

export const topicFilter = 'Deployment'
export const themeGroup = 'services'
export const themeValues = ['codecommit', 'ec2']

export interface ScriptedQuestion {
  id: string
  selectAnswers: string[]
  correct: boolean
  correctAnswers: string[]
}

export const scriptedQuestions: ScriptedQuestion[] = [
  { id: '24', selectAnswers: ['A'], correct: true, correctAnswers: ['A'] },
  { id: '241', selectAnswers: ['A', 'B'], correct: true, correctAnswers: ['A', 'B'] },
  { id: '416', selectAnswers: ['A'], correct: false, correctAnswers: ['B'] },
  { id: '421', selectAnswers: ['A', 'B'], correct: false, correctAnswers: ['A', 'C'] },
]

export const expectedResult = {
  totalQuestions: 4,
  correctCount: 2,
  percent: 50,
  projectedScore: 500,
  scale: 1000,
  passed: false,
}
