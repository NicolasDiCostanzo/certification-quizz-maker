import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { HistoryExportFile, QuizHistoryEntry } from '../types'
import { useQuizHistoryStore } from './quizHistory'

function makeEntry(overrides: Partial<QuizHistoryEntry> = {}): QuizHistoryEntry {
  return {
    id: 'e1',
    certCode: 'DVA-C02',
    mode: 'preparation',
    startedAt: 0,
    finishedAt: 1000,
    questionIds: ['q1'],
    answers: { q1: { selected: ['A'], correct: true, answeredAt: 1000 } },
    flags: [],
    result: { percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 },
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('quizHistory store', () => {
  it('records entries and lists them per cert code, newest first', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1', certCode: 'DVA-C02', finishedAt: 1000 }))
    store.record(makeEntry({ id: 'e2', certCode: 'DVA-C02', finishedAt: 2000 }))
    store.record(makeEntry({ id: 'e3', certCode: 'SAA-C03', finishedAt: 3000 }))

    expect(store.byCertCode('DVA-C02').map((e) => e.id)).toEqual(['e2', 'e1'])
  })

  it('computes all-time correct and attempted counts per cert code', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1', certCode: 'DVA-C02', result: { percentCorrect: 50, passed: false, timesCorrect: 1, totalAnswered: 2 } }))
    store.record(makeEntry({ id: 'e2', certCode: 'DVA-C02', result: { percentCorrect: 100, passed: true, timesCorrect: 2, totalAnswered: 2 } }))

    expect(store.allTimeCorrect('DVA-C02')).toBe(3)
    expect(store.allTimeAttempted('DVA-C02')).toBe(4)
  })

  it('deletes an entry by id', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1' }))
    store.deleteById('e1')

    expect(store.entries).toHaveLength(0)
  })

  it('resets entries for one cert code without touching others', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1', certCode: 'DVA-C02' }))
    store.record(makeEntry({ id: 'e2', certCode: 'SAA-C03' }))
    store.resetByCertCode('DVA-C02')

    expect(store.entries.map((e) => e.id)).toEqual(['e2'])
  })

  it('exports history in the documented versioned format', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1' }))

    const file = store.exportHistory()

    expect(file.format).toBe('quiz-history')
    expect(file.version).toBe(1)
    expect(file.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(file.entries).toEqual([makeEntry({ id: 'e1' })])
  })

  it('import merges entries by id, skipping ones already present locally', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1' }))

    const incoming: HistoryExportFile = {
      format: 'quiz-history',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: [makeEntry({ id: 'e1', result: { percentCorrect: 0, passed: false, timesCorrect: 0, totalAnswered: 1 } }), makeEntry({ id: 'e2' })],
    }

    store.importHistory(incoming)

    expect(store.entries.map((e) => e.id).sort()).toEqual(['e1', 'e2'])
    expect(store.entries.find((e) => e.id === 'e1')?.result.percentCorrect).toBe(100)
  })

  it('import rejects files with an unsupported format or version without applying them', () => {
    const store = useQuizHistoryStore()
    store.record(makeEntry({ id: 'e1' }))

    const incompatible = (overrides: Record<string, unknown>) =>
      ({ ...store.exportHistory(), entries: [makeEntry({ id: 'e2' })], ...overrides }) as unknown as HistoryExportFile

    store.importHistory(incompatible({ format: 'something-else' }))
    store.importHistory(incompatible({ version: 2 }))

    expect(store.entries.map((e) => e.id)).toEqual(['e1'])
  })
})
