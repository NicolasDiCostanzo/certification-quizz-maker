import type { Question, QuestionAnswer } from '../types'

export interface TopicBreakdown {
  label: string
  correct: number
  total: number
  percent: number
}

export interface ThemeBreakdown {
  group: string
  value: string
  correct: number
  total: number
  percent: number
}

function countForSubset(subset: Question[], answers: Record<string, QuestionAnswer>) {
  const correct = subset.filter((q) => answers[q.id]?.correct).length
  return { total: subset.length, correct }
}

export function breakdownByTopic(
  questions: Question[],
  answers: Record<string, QuestionAnswer>,
): TopicBreakdown[] {
  const byLabel = new Map<string, Question[]>()
  for (const q of questions) {
    const list = byLabel.get(q.topic) ?? []
    list.push(q)
    byLabel.set(q.topic, list)
  }

  return [...byLabel.entries()].map(([label, subset]) => {
    const { total, correct } = countForSubset(subset, answers)
    return {
      label,
      correct,
      total,
      percent: total === 0 ? 0 : Math.round((correct / total) * 100),
    }
  })
}

export function breakdownByTheme(
  questions: Question[],
  answers: Record<string, QuestionAnswer>,
  groups: string[],
): ThemeBreakdown[] {
  const cells: ThemeBreakdown[] = []

  for (const group of groups) {
    const byValue = new Map<string, Question[]>()
    for (const q of questions) {
      const values = q.themes?.[group]
      if (!values) continue
      for (const value of values) {
        const list = byValue.get(value) ?? []
        list.push(q)
        byValue.set(value, list)
      }
    }

    for (const [value, subset] of byValue) {
      const { total, correct } = countForSubset(subset, answers)
      cells.push({
        group,
        value,
        correct,
        total,
        percent: total === 0 ? 0 : Math.round((correct / total) * 100),
      })
    }
  }

  return cells
}
