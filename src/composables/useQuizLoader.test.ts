import { describe, expect, it } from 'vitest'
import { cloneBundle, validCertBundle } from '../utils/fixtures/certBundle.fixture'
import { loadBuiltInCerts } from './useQuizLoader'

describe('loadBuiltInCerts', () => {
  it('loads every valid bundle with a distinct exam code', () => {
    const second = cloneBundle(validCertBundle)
    second.exam.code = 'SECOND'

    const { certs, issuesByPath } = loadBuiltInCerts({
      '/src/assets/first.json': { default: validCertBundle },
      '/src/assets/second.json': { default: second },
    })

    expect(certs.map((c) => c.exam.code).sort()).toEqual(['FIX-001', 'SECOND'])
    expect(issuesByPath).toEqual({})
  })

  it('throws instead of silently dropping a bundle when two bundles share an exam code', () => {
    const duplicate = cloneBundle(validCertBundle)

    expect(() =>
      loadBuiltInCerts({
        '/src/assets/first.json': { default: validCertBundle },
        '/src/assets/duplicate.json': { default: duplicate },
      }),
    ).toThrow(/Duplicate exam code "FIX-001".*first\.json.*duplicate\.json/s)
  })

  it('excludes a bundle that fails schema validation and reports it under issuesByPath', () => {
    const { certs, issuesByPath } = loadBuiltInCerts({
      '/src/assets/broken.json': { default: { not: 'a cert bundle' } },
    })

    expect(certs).toEqual([])
    expect(issuesByPath['/src/assets/broken.json']).toBeInstanceOf(Array)
    expect(issuesByPath['/src/assets/broken.json'].length).toBeGreaterThan(0)
  })
})
