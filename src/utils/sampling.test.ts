import { describe, expect, it } from 'vitest'
import type { Question } from '../types'
import { sampleQuestions } from './sampling'

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeQuestion(id: string, topic: string): Question {
  return { id, question: `Question ${id}`, options: ['First option', 'Second option'], answers: 'A', topic }
}

function makePool(counts: Record<string, number>): Question[] {
  return Object.entries(counts).flatMap(([topic, n]) =>
    Array.from({ length: n }, (_, i) => makeQuestion(`${topic}-${i}`, topic)),
  )
}

const idsOf = (questions: Question[]) => questions.map((q) => q.id)

function countByTopic(questions: Question[]): Record<string, number> {
  return questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.topic] = (acc[q.topic] ?? 0) + 1
    return acc
  }, {})
}

describe('sampleQuestions', () => {
  it('returns every question exactly once, shuffled, when count is all', () => {
    const pool = makePool({ A: 12, B: 8 })

    const result = sampleQuestions(pool, 'all', undefined, mulberry32(7))

    expect(result).toHaveLength(20)
    expect([...idsOf(result)].sort()).toEqual([...idsOf(pool)].sort())
    expect(result).not.toEqual(pool)
  })

  it('returns the whole pool when count exceeds the pool size, even with weights', () => {
    const pool = makePool({ A: 5, B: 5 })

    const result = sampleQuestions(pool, 99, { A: 90, B: 10 }, mulberry32(1))

    expect(result).toHaveLength(10)
    expect(new Set(idsOf(result)).size).toBe(10)
  })

  it('returns exactly count unique questions from the pool without mutating it', () => {
    const pool = makePool({ A: 10, B: 10 })
    const poolOrder = idsOf(pool)

    const result = sampleQuestions(pool, 7, undefined, mulberry32(3))

    expect(result).toHaveLength(7)
    expect(new Set(idsOf(result)).size).toBe(7)
    for (const id of idsOf(result)) {
      expect(poolOrder).toContain(id)
    }
    expect(idsOf(pool)).toEqual(poolOrder)
  })

  it('returns an empty array for a count of zero or less', () => {
    const pool = makePool({ A: 5 })

    expect(sampleQuestions(pool, 0, undefined, mulberry32(1))).toEqual([])
    expect(sampleQuestions(pool, -3, undefined, mulberry32(1))).toEqual([])
  })

  it('is deterministic for a given seed', () => {
    const pool = makePool({ A: 10, B: 10 })

    expect(sampleQuestions(pool, 8, undefined, mulberry32(11))).toEqual(
      sampleQuestions(pool, 8, undefined, mulberry32(11)),
    )
  })

  it('splits the sample proportionally to the exam weights', () => {
    const pool = makePool({ A: 50, B: 50 })

    const result = sampleQuestions(pool, 10, { A: 80, B: 20 }, mulberry32(5))

    expect(countByTopic(result)).toEqual({ A: 8, B: 2 })
  })

  it('ignores weights of topics absent from the pool and renormalizes the ratio', () => {
    const pool = makePool({ A: 30, B: 30 })

    const result = sampleQuestions(pool, 10, { A: 40, B: 40, C: 20 }, mulberry32(5))

    expect(countByTopic(result)).toEqual({ A: 5, B: 5 })
  })

  it('caps a topic at its available questions and redistributes the remainder by weight', () => {
    const pool = makePool({ A: 2, B: 30 })

    const result = sampleQuestions(pool, 10, { A: 90, B: 10 }, mulberry32(5))

    expect(countByTopic(result)).toEqual({ A: 2, B: 8 })
  })

  it('redistributes seats freed by a capped topic proportionally by weight', () => {
    const pool = makePool({ A: 3, B: 8, C: 1 })

    for (let seed = 1; seed <= 20; seed += 1) {
      const result = sampleQuestions(pool, 10, { A: 1, B: 3, C: 1 }, mulberry32(seed))

      expect(countByTopic(result), `seed ${seed}`).toEqual({ A: 2, B: 7, C: 1 })
    }
  })

  it('never samples a zero-weight topic when weighted topics can fill the count', () => {
    const pool = makePool({ A: 20, B: 20 })

    const result = sampleQuestions(pool, 5, { A: 100, B: 0 }, mulberry32(5))

    expect(countByTopic(result)).toEqual({ A: 5 })
  })

  it('falls back to uniform sampling without weights', () => {
    const pool = makePool({ A: 20 })

    const result = sampleQuestions(pool, 6, undefined, mulberry32(9))

    expect(result).toHaveLength(6)
    expect(new Set(idsOf(result)).size).toBe(6)
  })

  it('falls back to uniform sampling when no pool topic has a weight', () => {
    const pool = makePool({ A: 15, B: 15 })

    const result = sampleQuestions(pool, 4, { C: 100 }, mulberry32(9))

    expect(result).toHaveLength(4)
  })

  it('matches the DVA-C02 exam ratios for a 65-question preset', () => {
    const weights = {
      'Development with AWS Services': 32,
      Deployment: 24,
      Security: 26,
      'Troubleshooting and Optimization': 18,
    }
    const pool = makePool({
      'Development with AWS Services': 200,
      Deployment: 150,
      Security: 160,
      'Troubleshooting and Optimization': 45,
    })

    const result = sampleQuestions(pool, 65, weights, mulberry32(2))

    expect(countByTopic(result)).toEqual({
      'Development with AWS Services': 21,
      Deployment: 15,
      Security: 17,
      'Troubleshooting and Optimization': 12,
    })
  })
})
