import { describe, expect, it } from 'vitest'
import { validateCertBundle } from '../utils/schemaValidator'
import type { CertBundle } from '../types'

const modules = import.meta.glob<{ default: unknown }>('./*questions.json', { eager: true })

function loadBundle(path: string, mod: { default: unknown }): CertBundle {
  const result = validateCertBundle(mod.default)
  expect(result.valid, `${path}: ${result.errors.join('; ')}`).toBe(true)
  return result.bundle as CertBundle
}

describe('cert theme integrity', () => {
  it('declares every theme group and value a question references', () => {
    for (const [path, mod] of Object.entries(modules)) {
      const bundle = loadBundle(path, mod)
      const undeclared: string[] = []
      for (const question of bundle.questions) {
        for (const [group, values] of Object.entries(question.themes ?? {})) {
          if (!Object.hasOwn(bundle.themes, group)) {
            undeclared.push(`group "${group}" (question ${question.id})`)
            continue
          }
          for (const value of values) {
            if (!(bundle.themes[group] as string[]).includes(value)) {
              undeclared.push(`value "${group}.${value}" (question ${question.id})`)
            }
          }
        }
      }
      expect(
        undeclared,
        `${path} references theme values missing from its registry: ${undeclared.join(', ')}. Add them to the top-level "themes" registry or retag the questions.`,
      ).toEqual([])
    }
  })

  it('declares no theme value that no question uses', () => {
    for (const [path, mod] of Object.entries(modules)) {
      const bundle = loadBundle(path, mod)
      const used = new Set<string>()
      for (const question of bundle.questions) {
        for (const [group, values] of Object.entries(question.themes ?? {})) {
          for (const value of values) used.add(`${group}/${value}`)
        }
      }
      const orphans = Object.entries(bundle.themes).flatMap(([group, values]) =>
        values
          .filter((value) => !used.has(`${group}/${value}`))
          .map((value) => `${group}.${value}`),
      )
      expect(
        orphans,
        `${path} declares theme values no question uses: ${orphans.join(', ')}. Remove them or tag the questions that should carry them — an unused value usually means a copied registry or an untagged question.`,
      ).toEqual([])
    }
  })

  it('tags every question, so none is invisible to theme filters', () => {
    for (const [path, mod] of Object.entries(modules)) {
      const bundle = loadBundle(path, mod)
      const untagged = bundle.questions
        .filter((question) => Object.keys(question.themes ?? {}).length === 0)
        .map((question) => question.id)
      expect(
        untagged,
        `${path} has questions with no themes: they can never be selected by a theme filter. Tag them, or drop "themes" for the whole bundle deliberately.`,
      ).toEqual([])
    }
  })

  it('uses one taxonomy shape across certs that share question types', () => {
    const bundles = Object.values(modules).map((mod) => loadBundle('bundle', mod))
    const questionTypes = new Map(
      bundles.map((bundle) => [bundle.exam.code, new Set(bundle.themes.questionTypes ?? [])]),
    )
    const shape = new Map(
      bundles.map((bundle) => [bundle.exam.code, Object.keys(bundle.themes).sort().join(', ')]),
    )
    const drifting: string[] = []
    for (const [a, typesA] of questionTypes) {
      for (const [b, typesB] of questionTypes) {
        if (a >= b) continue
        const shared = [...typesA].filter((value) => typesB.has(value))
        if (shared.length === 0) continue
        const overlap = shared.length / new Set([...typesA, ...typesB]).size
        if (overlap >= 0.7 && shape.get(a) !== shape.get(b)) {
          drifting.push(`${a} "${shape.get(a)}" vs ${b} "${shape.get(b)}" (${shared.length} shared question types)`)
        }
      }
    }
    expect(
      drifting,
      `Certs sharing most of their question types are one family and must name their theme groups identically, so a filter means the same thing everywhere: ${drifting.join(' | ')}`,
    ).toEqual([])
  })
})
