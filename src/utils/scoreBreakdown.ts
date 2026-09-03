import type { Question, QuestionAnswer, QuizHistoryEntry } from '../types'

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
      for (const value of new Set(values)) {
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

export function breakdownByTopicAllTime(entries: QuizHistoryEntry[]): TopicBreakdown[] {
  const byLabel = new Map<string, { correct: number; total: number }>()
  for (const entry of entries) {
    for (const q of entry.questions) {
      const cell = byLabel.get(q.topic) ?? { correct: 0, total: 0 }
      cell.total += 1
      if (entry.answers[q.id]?.correct) cell.correct += 1
      byLabel.set(q.topic, cell)
    }
  }
  return [...byLabel.entries()].map(([label, cell]) => ({
    label,
    correct: cell.correct,
    total: cell.total,
    percent: cell.total === 0 ? 0 : Math.round((cell.correct / cell.total) * 100),
  }))
}

export function breakdownByThemeAllTime(
  entries: QuizHistoryEntry[],
  groups: string[],
): ThemeBreakdown[] {
  const cells: ThemeBreakdown[] = []
  for (const group of groups) {
    const byValue = new Map<string, { correct: number; total: number }>()
    for (const entry of entries) {
      for (const q of entry.questions) {
        const values = q.themes?.[group]
        if (!values) continue
        for (const value of new Set(values)) {
          const cell = byValue.get(value) ?? { correct: 0, total: 0 }
          cell.total += 1
          if (entry.answers[q.id]?.correct) cell.correct += 1
          byValue.set(value, cell)
        }
      }
    }
    for (const [value, cell] of byValue) {
      cells.push({
        group,
        value,
        correct: cell.correct,
        total: cell.total,
        percent: cell.total === 0 ? 0 : Math.round((cell.correct / cell.total) * 100),
      })
    }
  }
  return cells
}
