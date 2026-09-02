import { describe, expect, it } from 'vitest'
import { computeScore, isCorrect } from './scoring'
import type { ExamInfo, Question, QuestionAnswer } from '../types'

function makeQuestion(id: string, answers: string | string[]): Question {
  return {
    id,
    question: `Question ${id}`,
    options: ['A', 'B', 'C', 'D'],
    answers,
    topic: 't1',
  }
}

function makeAnswers(questions: Question[], ids: string[]): Record<string, QuestionAnswer> {
  const byId = new Map(questions.map((q) => [q.id, q]))
  return Object.fromEntries(
    ids.map((id) => {
      const q = byId.get(id)
      const expected = Array.isArray(q?.answers) ? q!.answers : q?.answers ? [q.answers] : []
      return [id, { selected: expected, correct: isCorrect(q!, expected), answeredAt: 0 }]
    }),
  )
}

const examScaled: ExamInfo = {
  name: 'DVA-C02',
  code: 'DVA-C02',
  totalQuestions: 65,
  timeLimitMinutes: 130,
  passingScore: { passingScore: 720, scale: 1000 },
}

const examPercent: ExamInfo = {
  name: 'PERCENT-CERT',
  code: 'PERCENT',
  totalQuestions: 50,
  timeLimitMinutes: 90,
  passingScore: { passingScore: 70 },
}

describe('isCorrect', () => {
  it.each([
    { answers: 'B', selected: ['B'], expected: true },
    { answers: 'B', selected: ['A'], expected: false },
    { answers: ['A', 'C'], selected: ['A', 'C'], expected: true },
    { answers: ['A', 'C'], selected: ['C', 'A'], expected: true },
    { answers: ['A', 'C'], selected: ['A'], expected: false },
    { answers: ['A', 'C'], selected: ['A', 'B'], expected: false },
    { answers: ['A', 'C'], selected: ['A', 'A'], expected: false },
  ])('answers=$answers selected=$selected → $expected', ({ answers, selected, expected }) => {
    expect(isCorrect(makeQuestion('q', answers), selected)).toBe(expected)
  })
})

describe('computeScore', () => {
  it('counts unanswered as wrong in exam mode', () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'C'), makeQuestion('q3', 'A')]
    const answers = { q1: { selected: ['B'], correct: true, answeredAt: 0 } }
    const result = computeScore(questions, answers, 'exam', examScaled)
    expect(result.timesCorrect).toBe(1)
    expect(result.totalAnswered).toBe(3)
    expect(result.percentCorrect).toBeCloseTo(33.33, 1)
  })

  it('counts only answered in preparation mode', () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'C')]
    const answers = { q1: { selected: ['B'], correct: true, answeredAt: 0 } }
    const result = computeScore(questions, answers, 'preparation', examScaled)
    expect(result.timesCorrect).toBe(1)
    expect(result.totalAnswered).toBe(1)
    expect(result.percentCorrect).toBe(100)
  })

  it('computes projected scaled score and passes', () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'C'), makeQuestion('q3', 'A'), makeQuestion('q4', 'D')]
    const answers = makeAnswers(questions, ['q1', 'q2', 'q3'])
    const result = computeScore(questions, answers, 'exam', examScaled)
    expect(result.percentCorrect).toBe(75)
    expect(result.projectedScaledScore).toBe(750)
    expect(result.passed).toBe(true)
  })

  it('fails when below threshold', () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'C'), makeQuestion('q3', 'A'), makeQuestion('q4', 'D')]
    const answers = makeAnswers(questions, ['q1'])
    const result = computeScore(questions, answers, 'exam', examScaled)
    expect(result.percentCorrect).toBe(25)
    expect(result.projectedScaledScore).toBe(250)
    expect(result.passed).toBe(false)
  })

  it('handles percentage-based cert without scale', () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'C')]
    const answers = makeAnswers(questions, ['q1'])
    const result = computeScore(questions, answers, 'exam', examPercent)
    expect(result.percentCorrect).toBe(50)
    expect(result.projectedScaledScore).toBeUndefined()
    expect(result.passed).toBe(false)
  })

  it('returns zero when nothing answered in preparation mode', () => {
    const questions = [makeQuestion('q1', 'B')]
    const result = computeScore(questions, {}, 'preparation', examScaled)
    expect(result.percentCorrect).toBe(0)
    expect(result.totalAnswered).toBe(0)
    expect(result.timesCorrect).toBe(0)
  })

  it('all correct passes with full score', () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'C')]
    const answers = makeAnswers(questions, ['q1', 'q2'])
    const result = computeScore(questions, answers, 'exam', examScaled)
    expect(result.percentCorrect).toBe(100)
    expect(result.projectedScaledScore).toBe(1000)
    expect(result.passed).toBe(true)
  })
})
