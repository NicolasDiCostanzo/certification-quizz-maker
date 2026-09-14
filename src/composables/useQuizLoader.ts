import type { CertBundle, Question } from '../types'
import { isQuestionAnswerable, validateCertBundle } from '../utils/schemaValidator'

const modules = import.meta.glob<{ default: unknown }>('/src/assets/*questions.json', { eager: true })

export function loadBuiltInCerts(
  modules: Record<string, { default: unknown }>,
): { certs: CertBundle[]; issuesByPath: Record<string, string[]> } {
  const certs: CertBundle[] = []
  const issuesByPath: Record<string, string[]> = {}
  const pathByExamCode = new Map<string, string>()

  for (const [path, mod] of Object.entries(modules)) {
    const result = validateCertBundle(mod.default)
    if (result.valid && result.bundle) {
      const examCode = result.bundle.exam.code
      const existingPath = pathByExamCode.get(examCode)
      if (existingPath) {
        throw new Error(
          `Duplicate exam code "${examCode}": both "${existingPath}" and "${path}" provide this certification. Remove or rename one of the bundles before shipping.`,
        )
      }
      pathByExamCode.set(examCode, path)
      certs.push(result.bundle)
    } else {
      issuesByPath[path] = result.errors
    }
  }

  return { certs, issuesByPath }
}

const { certs: availableCerts, issuesByPath: certLoadIssues } = loadBuiltInCerts(modules)

if (Object.keys(certLoadIssues).length > 0) {
  for (const [path, errors] of Object.entries(certLoadIssues)) {
    console.error(`Cert bundle "${path}" was excluded due to load issues:`, errors)
  }
}

export function useQuizLoader() {
  function getCert(examCode: string): CertBundle | undefined {
    return availableCerts.find((cert) => cert.exam.code === examCode)
  }

  function activePool(examCode: string): Question[] {
    return getCert(examCode)?.questions.filter(isQuestionAnswerable) ?? []
  }

  function resolveQuestions(examCode: string, questionIds: string[]): Question[] {
    const cert = getCert(examCode)
    if (!cert) return []
    const byId = new Map(cert.questions.map((q) => [q.id, q]))
    return questionIds.map((id) => byId.get(id)).filter((q): q is Question => q !== undefined)
  }

  return {
    availableCerts,
    certLoadIssues,
    getCert,
    activePool,
    resolveQuestions,
  }
}
