import { describe, expect, it } from 'vitest'
import certManifest from './cert-manifest.json'
import { validateCertBundle } from '../utils/schemaValidator'

const modules = import.meta.glob<{ default: unknown }>('./*questions.json', { eager: true })

describe('cert manifest', () => {
  it('lists exactly one entry per bundle file', () => {
    const bundleFiles = Object.keys(modules).map((path) => path.replace('./', '')).sort()
    expect(certManifest.map((entry) => entry.file).sort()).toEqual(bundleFiles)
  })

  it('matches each bundle content and every bundle passes schema validation', () => {
    for (const entry of certManifest) {
      const mod = modules[`./${entry.file}`]
      expect(mod, `no bundle file found for manifest entry "${entry.file}"`).toBeDefined()
      const result = validateCertBundle(mod?.default)
      expect(result.valid, `${entry.file}: ${result.errors.join('; ')}`).toBe(true)
      const bundle = mod?.default as { exam: unknown; questions: unknown[] }
      expect(bundle.exam).toEqual(entry.exam)
      expect(bundle.questions).toHaveLength(entry.questionCount)
    }
  })
})