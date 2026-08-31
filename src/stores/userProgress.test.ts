import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ProgressExportFile } from '../types'
import { useUserProgressStore } from './userProgress'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('userProgress store', () => {
  it('accumulates attempts and correct/wrong counts across multiple answers', () => {
    const store = useUserProgressStore()

    store.recordAnswer('DVA-C02', 'q1', true)
    store.recordAnswer('DVA-C02', 'q1', false)
    store.recordAnswer('DVA-C02', 'q1', true)

    const entry = store.byExamCode['DVA-C02'].q1
    expect(entry.attempts).toBe(3)
    expect(entry.timesCorrect).toBe(2)
    expect(entry.timesWrong).toBe(1)
    expect(entry.lastSeenAt).toBeGreaterThan(0)
  })

  it('toggles the flag on a question, creating an entry if none exists yet', () => {
    const store = useUserProgressStore()

    store.toggleFlag('DVA-C02', 'q1')
    expect(store.byExamCode['DVA-C02'].q1.flagged).toBe(true)

    store.toggleFlag('DVA-C02', 'q1')
    expect(store.byExamCode['DVA-C02'].q1.flagged).toBe(false)
  })

  it.each([
    ['isWrong', 'timesWrong > timesCorrect', { attempts: 2, timesCorrect: 0, timesWrong: 2 }, true],
    ['isWrong', 'timesCorrect >= timesWrong', { attempts: 2, timesCorrect: 2, timesWrong: 0 }, false],
  ] as const)('%s: %s', (_getter, _label, partial, expected) => {
    const store = useUserProgressStore()
    store.byExamCode['DVA-C02'] = {
      q1: { questionId: 'q1', flagged: false, lastSeenAt: 1, ...partial },
    }
    expect(store.isWrong('DVA-C02', 'q1')).toBe(expected)
  })

  it('isFlagged and isUnattempted reflect stored state', () => {
    const store = useUserProgressStore()

    expect(store.isUnattempted('DVA-C02', 'q1')).toBe(true)
    expect(store.isFlagged('DVA-C02', 'q1')).toBe(false)

    store.recordAnswer('DVA-C02', 'q1', true)
    expect(store.isUnattempted('DVA-C02', 'q1')).toBe(false)

    store.toggleFlag('DVA-C02', 'q1')
    expect(store.isFlagged('DVA-C02', 'q1')).toBe(true)
  })

  it('exports progress in the documented versioned format', () => {
    const store = useUserProgressStore()
    store.recordAnswer('DVA-C02', 'q1', true)

    const file = store.exportProgress()

    expect(file.format).toBe('quiz-progress')
    expect(file.version).toBe(1)
    expect(file.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(file.byExamCode['DVA-C02'].q1.attempts).toBe(1)
  })

  it('import merge: the entry with the newer lastSeenAt wins, per question', () => {
    const store = useUserProgressStore()
    store.byExamCode['DVA-C02'] = {
      q1: { questionId: 'q1', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1000 },
      q2: { questionId: 'q2', attempts: 5, timesCorrect: 0, timesWrong: 5, flagged: false, lastSeenAt: 9999 },
    }

    const incoming: ProgressExportFile = {
      format: 'quiz-progress',
      version: 1,
      exportedAt: new Date().toISOString(),
      byExamCode: {
        'DVA-C02': {
          q1: { questionId: 'q1', attempts: 9, timesCorrect: 9, timesWrong: 0, flagged: true, lastSeenAt: 2000 },
          q2: { questionId: 'q2', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1 },
        },
        'SAA-C03': {
          q1: { questionId: 'q1', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 500 },
        },
      },
    }

    store.importProgress(incoming)

    // q1: incoming is newer -> incoming wins
    expect(store.byExamCode['DVA-C02'].q1.attempts).toBe(9)
    // q2: local is newer -> local is kept
    expect(store.byExamCode['DVA-C02'].q2.attempts).toBe(5)
    // a different exam code is added without disturbing DVA-C02
    expect(store.byExamCode['SAA-C03'].q1.attempts).toBe(1)
  })

  it('import rejects files with an unsupported format or version without applying them', () => {
    const store = useUserProgressStore()
    store.recordAnswer('DVA-C02', 'q1', true)

    const incompatible = (overrides: Record<string, unknown>) =>
      ({
        ...store.exportProgress(),
        byExamCode: {
          'DVA-C02': {
            q1: { questionId: 'q1', attempts: 99, timesCorrect: 99, timesWrong: 0, flagged: false, lastSeenAt: 9999 },
          },
        },
        ...overrides,
      }) as unknown as ProgressExportFile

    store.importProgress(incompatible({ format: 'something-else' }))
    store.importProgress(incompatible({ version: 2 }))

    expect(store.byExamCode['DVA-C02'].q1.attempts).toBe(1)
  })
})

