import { describe, expect, it } from 'vitest'
import type { ThemeGroupFilter, ThemeMatchMode } from '../types'
import { buildQuestionPool, filterByReplay, filterByThemes, filterByTopics } from './filterPool'
import { idsOf, pool, progress } from './fixtures/filterPool.fixture'

const group = (values: string[], match: ThemeGroupFilter['match'] = 'any'): ThemeGroupFilter => ({
  values,
  match,
})

describe('filterByThemes', () => {
  it.each([
    ...([
      { include: { services: group(['lambda']) }, mode: 'and' as const, exclude: {}, expected: ['q1'] },
      { include: { services: group(['lambda', 's3'], 'any') }, mode: 'and' as const, exclude: {}, expected: ['q1', 'q2'] },
      { include: { services: group(['lambda', 's3'], 'all') }, mode: 'and' as const, exclude: {}, expected: [] },
      { include: { services: group(['container', 'ec2'], 'all') }, mode: 'and' as const, exclude: {}, expected: ['q5'] },
      { include: { services: group(['container', 'lambda'], 'any') }, mode: 'and' as const, exclude: {}, expected: ['q1', 'q5'] },
      {
        include: { services: group(['s3'], 'any'), concepts: group(['encryption'], 'any') },
        mode: 'or' as const,
        exclude: {},
        expected: ['q1', 'q2', 'q3'],
      },
      {
        include: { services: group(['s3'], 'any'), concepts: group(['encryption'], 'any') },
        mode: 'and' as const,
        exclude: {},
        expected: [],
      },
      {
        include: { services: group(['container', 'ec2'], 'all'), concepts: group(['api-design'], 'any') },
        mode: 'and' as const,
        exclude: {},
        expected: ['q5'],
      },
      {
        include: {
          services: group(['container', 'ec2'], 'all'),
          concepts: group(['api-design'], 'any'),
          questionTypes: group(['architecture-decision', 'troubleshooting'], 'all'),
        },
        mode: 'and' as const,
        exclude: {},
        expected: [],
      },
      { include: {}, mode: 'and' as const, exclude: { services: ['s3'] }, expected: ['q1', 'q3', 'q4', 'q5'] },
      { include: { services: group(['s3']) }, mode: 'or' as const, exclude: { services: ['s3'] }, expected: [] },
    ] as { include: Record<string, ThemeGroupFilter>; mode: ThemeMatchMode; exclude: Record<string, string[]>; expected: string[] }[]),
  ])('include=$include mode=$mode exclude=$exclude -> $expected', ({ include, mode, exclude, expected }) => {
    expect(idsOf(filterByThemes(pool, include, mode, exclude))).toEqual(expected)
  })

  it('drops untagged questions when an include filter is set', () => {
    expect(idsOf(filterByThemes(pool, { concepts: group(['encryption']) }, 'or', {}))).toEqual(['q1', 'q3'])
  })

  it('keeps untagged questions when no include filter is set', () => {
    expect(idsOf(filterByThemes(pool, {}, 'and', {}))).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'])
  })
})

describe('filterByTopics', () => {
  it.each([
    { topics: undefined, expected: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    { topics: [], expected: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    { topics: ['Security'], expected: ['q1', 'q2', 'q5'] },
    { topics: ['Security', 'Deployment'], expected: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    { topics: ['Nonexistent'], expected: [] },
  ] as { topics: string[] | undefined; expected: string[] }[])('topics=$topics -> $expected', ({ topics, expected }) => {
    expect(idsOf(filterByTopics(pool, topics))).toEqual(expected)
  })
})

describe('filterByReplay', () => {
  it.each([
    { mode: 'all' as const, progress: {}, expected: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    { mode: 'unattempted' as const, progress: progress({ q1: { attempts: 1 } }), expected: ['q2', 'q3', 'q4', 'q5'] },
    { mode: 'unattempted' as const, progress: progress({ q1: { attempts: 0 } }), expected: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    {
      mode: 'wrong' as const,
      progress: progress({
        q1: { timesWrong: 2, timesCorrect: 1 },
        q2: { timesWrong: 1, timesCorrect: 1 },
        q3: { timesWrong: 0, timesCorrect: 1 },
      }),
      expected: ['q1'],
    },
    {
      mode: 'flagged' as const,
      progress: progress({ q1: { flagged: true }, q2: {} }),
      expected: ['q1'],
    },
  ])('mode=$mode -> $expected', ({ mode, progress: entries, expected }) => {
    expect(idsOf(filterByReplay(pool, mode, entries))).toEqual(expected)
  })
})

describe('buildQuestionPool', () => {
  const bundle = { questions: pool }

  it('composes theme, topic, and replay filters', () => {
    const result = buildQuestionPool(bundle, {
      includeThemes: {
        services: group(['lambda', 's3'], 'any'),
        concepts: group(['encryption'], 'any'),
      },
      includeMatchMode: 'or',
      topics: ['Security'],
      replayMode: 'unattempted',
      progress: progress({ q1: { attempts: 1 } }),
    })

    expect(idsOf(result)).toEqual(['q2'])
  })

  it('applies exclude after include', () => {
    const result = buildQuestionPool(bundle, {
      includeThemes: { services: group(['lambda', 's3'], 'any') },
      includeMatchMode: 'or',
      excludeThemes: { concepts: ['encryption'] },
    })

    expect(idsOf(result)).toEqual(['q2'])
  })

  it('returns the full pool when no options are provided', () => {
    expect(idsOf(buildQuestionPool(bundle))).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'])
  })
})
