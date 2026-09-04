import { describe, expect, it } from 'vitest'
import { formatPassingScore, passingScorePercent } from './examDisplay'

describe('passingScorePercent', () => {
  it('rounds a scaled score to its percentage', () => {
    expect(passingScorePercent({ passingScore: 720, scale: 1000 })).toBe(72)
    expect(passingScorePercent({ passingScore: 649, scale: 1000 })).toBe(65)
  })

  it('returns the value as-is for a percentage-based score without a scale', () => {
    expect(passingScorePercent({ passingScore: 60 })).toBe(60)
  })
})

describe('formatPassingScore', () => {
  it('formats a scaled score as value / scale with the projected percentage', () => {
    expect(formatPassingScore({ passingScore: 720, scale: 1000 })).toBe('720 / 1000 (72%)')
  })

  it('rounds the projected percentage', () => {
    expect(formatPassingScore({ passingScore: 700, scale: 1000 })).toBe('700 / 1000 (70%)')
    expect(formatPassingScore({ passingScore: 649, scale: 1000 })).toBe('649 / 1000 (65%)')
  })

  it('formats a percentage-based score without a scale', () => {
    expect(formatPassingScore({ passingScore: 60 })).toBe('60%')
    expect(formatPassingScore({ passingScore: 72.5 })).toBe('72.5%')
  })
})
