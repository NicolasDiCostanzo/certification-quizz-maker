import type { ExamInfo, Question, QuestionAnswer, ScoreResult } from '../types'

export function isCorrect(question: Question, selected: string[]): boolean {
  const expected = Array.isArray(question.answers) ? question.answers : [question.answers]
  if (expected.length !== selected.length) return false
  const expectedSet = new Set(expected)
  const selectedSet = new Set(selected)
  return selectedSet.size === selected.length && selected.every((letter) => expectedSet.has(letter))
}

export function computeScore(
  questions: Question[],
  answers: Record<string, QuestionAnswer>,
  exam: ExamInfo,
): ScoreResult {
  const totalAnswered = questions.length
  const timesCorrect = questions.filter((q) => answers[q.id]?.correct).length
  const percentCorrect = totalAnswered === 0 ? 0 : (timesCorrect / totalAnswered) * 100

  const scale = exam.passingScore.scale
  const thresholdPercent = scale ? (exam.passingScore.passingScore / scale) * 100 : exam.passingScore.passingScore
  const passed = percentCorrect >= thresholdPercent

  const result: ScoreResult = {
    percentCorrect,
    passed,
    timesCorrect,
    totalAnswered,
  }

  if (scale) {
    result.projectedScaledScore = Math.round((percentCorrect / 100) * scale)
  }

  return result
}
