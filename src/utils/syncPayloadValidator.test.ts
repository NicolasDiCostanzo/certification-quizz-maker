import { describe, expect, it } from 'vitest'
import { validateHistoryExportFile, validateProgressExportFile } from './syncPayloadValidator'

const validQuestionProgress = { questionId: 'q1', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1 }
const validHistoryEntry = {
  id: 'h1',
  certCode: 'DVA-C02',
  mode: 'preparation',
  startedAt: 1,
  finishedAt: 2,
  questionIds: ['q1'],
  answers: {},
  flags: [],
  result: { percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 },
}

const validProgress = { format: 'quiz-progress', version: 1, exportedAt: 'now', byExamCode: {} }
const validHistory = { format: 'quiz-history', version: 1, exportedAt: 'now', entries: [] }

describe('validateProgressExportFile', () => {
  it('accepts a well-formed progress document', () => {
    expect(validateProgressExportFile(validProgress)).toEqual([])
  })

  it('accepts a document with valid nested question-progress records', () => {
    const progress = { ...validProgress, byExamCode: { 'DVA-C02': { q1: validQuestionProgress } } }
    expect(validateProgressExportFile(progress)).toEqual([])
  })

  it.each([
    ['the value is not an object', 'nope', ['invalid progress document']],
    ['the value is an array', [], ['invalid progress document']],
    ['format is wrong', { ...validProgress, format: 'other' }, ['invalid progress.format']],
    ['version is not a safe integer', { ...validProgress, version: 1.5 }, ['invalid progress.version']],
    ['version is a different supported-looking integer', { ...validProgress, version: 2 }, ['invalid progress.version']],
    ['exportedAt is not a string', { ...validProgress, exportedAt: 1 }, ['invalid progress.exportedAt']],
    ['byExamCode is not an object', { ...validProgress, byExamCode: 'nope' }, ['invalid progress.byExamCode']],
    ['byExamCode is an array', { ...validProgress, byExamCode: [] }, ['invalid progress.byExamCode']],
    [
      'a byExamCode entry is not an object',
      { ...validProgress, byExamCode: { 'DVA-C02': 'nope' } },
      ['invalid progress.byExamCode.DVA-C02'],
    ],
    [
      'a nested question-progress record is null',
      { ...validProgress, byExamCode: { 'DVA-C02': { q1: null } } },
      ['invalid progress.byExamCode.DVA-C02.q1'],
    ],
    [
      'a nested question-progress record is missing required fields',
      { ...validProgress, byExamCode: { 'DVA-C02': { q1: { questionId: 'q1' } } } },
      ['invalid progress.byExamCode.DVA-C02.q1'],
    ],
  ])('rejects a document where %s', (_label, value, expectedErrors) => {
    expect(validateProgressExportFile(value)).toEqual(expectedErrors)
  })
})

describe('validateHistoryExportFile', () => {
  it('accepts a well-formed history document', () => {
    expect(validateHistoryExportFile(validHistory)).toEqual([])
  })

  it('accepts a document with valid history entries', () => {
    const history = { ...validHistory, entries: [validHistoryEntry] }
    expect(validateHistoryExportFile(history)).toEqual([])
  })

  it.each([
    ['the value is not an object', 'nope', ['invalid history document']],
    ['the value is an array', [], ['invalid history document']],
    ['format is wrong', { ...validHistory, format: 'other' }, ['invalid history.format']],
    ['version is not a safe integer', { ...validHistory, version: 1.5 }, ['invalid history.version']],
    ['version is a different supported-looking integer', { ...validHistory, version: 2 }, ['invalid history.version']],
    ['exportedAt is not a string', { ...validHistory, exportedAt: 1 }, ['invalid history.exportedAt']],
    ['entries is not an array', { ...validHistory, entries: 'nope' }, ['invalid history.entries']],
    [
      'an entry is null',
      { ...validHistory, entries: [null] },
      ['invalid history.entries[0]'],
    ],
    [
      'an entry is missing required fields',
      { ...validHistory, entries: [{ id: 'h1' }] },
      ['invalid history.entries[0]'],
    ],
  ])('rejects a document where %s', (_label, value, expectedErrors) => {
    expect(validateHistoryExportFile(value)).toEqual(expectedErrors)
  })
})
