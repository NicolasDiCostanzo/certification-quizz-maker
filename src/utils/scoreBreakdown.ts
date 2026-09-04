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

interface Cell {
  total: number
  correct: number
}

function tally(items: { key: string; correct: boolean }[]): Map<string, Cell> {
  const byKey = new Map<string, Cell>()
  for (const { key, correct } of items) {
    const cell = byKey.get(key) ?? { total: 0, correct: 0 }
    cell.total += 1
    if (correct) cell.correct += 1
    byKey.set(key, cell)
  }
  return byKey
}

function percentOf(cell: Cell): number {
  return cell.total === 0 ? 0 : Math.round((cell.correct / cell.total) * 100)
}

function themeItems(
  questions: Question[],
  group: string,
  isCorrect: (question: Question) => boolean,
): { key: string; correct: boolean }[] {
  const items: { key: string; correct: boolean }[] = []
  for (const q of questions) {
    const values = q.themes?.[group]
    if (!values) continue
    for (const value of new Set(values)) {
      items.push({ key: value, correct: isCorrect(q) })
    }
  }
  return items
}

export function breakdownByTopic(
  questions: Question[],
  answers: Record<string, QuestionAnswer>,
): TopicBreakdown[] {
  const items = questions.map((q) => ({ key: q.topic, correct: !!answers[q.id]?.correct }))
  return [...tally(items).entries()].map(([label, cell]) => ({ label, ...cell, percent: percentOf(cell) }))
}

export function breakdownByTheme(
  questions: Question[],
  answers: Record<string, QuestionAnswer>,
  groups: string[],
): ThemeBreakdown[] {
  const cells: ThemeBreakdown[] = []
  for (const group of groups) {
    const items = themeItems(questions, group, (q) => !!answers[q.id]?.correct)
    for (const [value, cell] of tally(items)) {
      cells.push({ group, value, ...cell, percent: percentOf(cell) })
    }
  }
  return cells
}

export function breakdownByTopicAllTime(entries: QuizHistoryEntry[]): TopicBreakdown[] {
  const items = entries.flatMap((entry) =>
    entry.questions.map((q) => ({ key: q.topic, correct: !!entry.answers[q.id]?.correct })),
  )
  return [...tally(items).entries()].map(([label, cell]) => ({ label, ...cell, percent: percentOf(cell) }))
}

export function breakdownByThemeAllTime(
  entries: QuizHistoryEntry[],
  groups: string[],
): ThemeBreakdown[] {
  const cells: ThemeBreakdown[] = []
  for (const group of groups) {
    const items = entries.flatMap((entry) =>
      themeItems(entry.questions, group, (q) => !!entry.answers[q.id]?.correct),
    )
    for (const [value, cell] of tally(items)) {
      cells.push({ group, value, ...cell, percent: percentOf(cell) })
    }
  }
  return cells
}
