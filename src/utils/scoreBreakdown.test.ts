import { describe, expect, it } from 'vitest'
import { breakdownByTheme, breakdownByTopic } from './scoreBreakdown'
import type { Question, QuestionAnswer } from '../types'

function makeQuestion(id: string, topic: string, themes?: Record<string, string[]>): Question {
  return {
    id,
    question: `Question ${id}`,
    options: ['A', 'B', 'C'],
    answers: 'B',
    topic,
    themes,
  }
}

function makeAnswer(correct: boolean): QuestionAnswer {
  return { selected: ['B'], correct, answeredAt: Date.now() }
}

describe('scoreBreakdown', () => {
  const questions: Question[] = [
    makeQuestion('q1', 'Security', { services: ['lambda'] }),
    makeQuestion('q2', 'Deployment', { services: ['s3'] }),
    makeQuestion('q3', 'Security', { services: ['lambda'] }),
  ]

  it('counts unanswered questions as wrong', () => {
    const answers = { q1: makeAnswer(true), q2: makeAnswer(false) }
    const result = breakdownByTopic(questions, answers)

    const security = result.find((r) => r.label === 'Security')
    expect(security).toEqual({ label: 'Security', correct: 1, total: 2, percent: 50 })

    const deployment = result.find((r) => r.label === 'Deployment')
    expect(deployment).toEqual({ label: 'Deployment', correct: 0, total: 1, percent: 0 })
  })

  it('counts all questions including unanswered', () => {
    const answers = { q1: makeAnswer(true) }
    const result = breakdownByTopic(questions, answers)

    const security = result.find((r) => r.label === 'Security')
    expect(security).toEqual({ label: 'Security', correct: 1, total: 2, percent: 50 })
  })

  it('breaks down by theme group-value pairs', () => {
    const answers = { q1: makeAnswer(true), q2: makeAnswer(false), q3: makeAnswer(true) }
    const result = breakdownByTheme(questions, answers, ['services'])

    expect(result).toEqual([
      { group: 'services', value: 'lambda', correct: 2, total: 2, percent: 100 },
      { group: 'services', value: 's3', correct: 0, total: 1, percent: 0 },
    ])
  })

  it('omits theme groups not present on any session question', () => {
    const answers = { q1: makeAnswer(true) }
    const result = breakdownByTheme(questions, answers, ['services', 'concepts'])

    expect(result.some((r) => r.group === 'concepts')).toBe(false)
  })
})
