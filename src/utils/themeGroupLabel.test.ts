import { describe, expect, it } from 'vitest'
import { texts } from '../texts/en'
import { groupLabel } from './themeGroupLabel'

describe('groupLabel', () => {
  it('returns the localized label for a known theme group', () => {
    expect(groupLabel('services')).toBe(texts.services)
  })

  it('returns the raw key for an unknown theme group', () => {
    expect(groupLabel('cloudPractices')).toBe('cloudPractices')
  })

  it('falls back to the raw key when the texts entry is not a string', () => {
    expect(groupLabel('countAll')).toBe('countAll')
  })
})