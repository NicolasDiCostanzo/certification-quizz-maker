import type { CertBundle, Question } from '../types'
import { isQuestionAnswerable, validateCertBundle } from '../utils/schemaValidator'

const modules = import.meta.glob<{ default: unknown }>('/src/assets/*questions.json', { eager: true })

function loadBuiltInCerts(): { certs: CertBundle[]; issuesByPath: Record<string, string[]> } {
  const certs: CertBundle[] = []
  const issuesByPath: Record<string, string[]> = {}
  const seenExamCodes = new Set<string>()

  for (const [path, mod] of Object.entries(modules)) {
    const result = validateCertBundle(mod.default)
    if (result.valid && result.bundle) {
      const examCode = result.bundle.exam.code
      if (seenExamCodes.has(examCode)) {
        issuesByPath[path] = [
          `Duplicate exam code "${examCode}" — another bundle already provides this certification, so this bundle was excluded to keep getCert unambiguous.`,
        ]
        continue
      }
      seenExamCodes.add(examCode)
      certs.push(result.bundle)
    } else {
      issuesByPath[path] = result.errors
    }
  }

  return { certs, issuesByPath }
}

const { certs: availableCerts, issuesByPath: certLoadIssues } = loadBuiltInCerts()

if (Object.keys(certLoadIssues).length > 0) {
  for (const [path, errors] of Object.entries(certLoadIssues)) {
    console.error(`Cert bundle "${path}" was excluded due to load issues:`, errors)
  }
}

/**
 * Cert bundles are discovered once at build time (no runtime upload). A bundle
 * that fails validation is excluded and logged rather than crashing the app.
 */
export function useQuizLoader() {
  function getCert(examCode: string): CertBundle | undefined {
    return availableCerts.find((cert) => cert.exam.code === examCode)
  }

  function activePool(examCode: string): Question[] {
    return getCert(examCode)?.questions.filter(isQuestionAnswerable) ?? []
  }

  return {
    availableCerts,
    certLoadIssues,
    getCert,
    activePool,
  }
}
