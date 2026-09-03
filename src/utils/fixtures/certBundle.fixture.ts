import type { CertBundle } from '../../types'

export const validCertBundle: CertBundle = {
  version: 2,
  exam: {
    name: 'Fixture Certification',
    code: 'FIX-001',
    totalQuestions: 2,
    timeLimitMinutes: 60,
    passingScore: { passingScore: 700, scale: 1000 },
    weights: { Security: 60, Deployment: 40 },
    instructions: 'Answer all questions.',
  },
  themes: {
    services: ['lambda', 's3'],
    concepts: ['encryption'],
  },
  questions: [
    {
      id: 'q1',
      question: 'Single-select fixture question?',
      options: ['Option A', 'Option B', 'Option C'],
      answers: 'B',
      topic: 'Security',
      themes: { services: ['lambda'], concepts: ['encryption'] },
    },
    {
      id: 'q2',
      question: 'Multi-select fixture question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answers: ['A', 'C'],
      topic: 'Deployment',
    },
  ],
}

export const secondCertBundle: CertBundle = (() => {
  const bundle = cloneBundle(validCertBundle)
  bundle.exam = { ...bundle.exam, code: 'SECOND', name: 'Second Certification', totalQuestions: 65 }
  bundle.themes = { levels: ['begin', 'advanced'] }
  bundle.questions = [
    {
      id: 's1',
      question: 'Second cert question?',
      options: ['Option A', 'Option B'],
      answers: 'A',
      topic: 'General',
      themes: { levels: ['begin'] },
    },
  ]
  return bundle
})()

export function cloneBundle(bundle: CertBundle = validCertBundle): CertBundle {
  return JSON.parse(JSON.stringify(bundle)) as CertBundle
}
