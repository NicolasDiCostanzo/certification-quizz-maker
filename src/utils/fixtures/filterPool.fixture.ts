import type { Question, QuestionProgress, QuestionThemes } from '../../types'

const q = (id: string, topic: string, tags: QuestionThemes | undefined): Question => ({
  id,
  question: `Question ${id}`,
  options: ['First option', 'Second option'],
  answers: 'A',
  topic,
  themes: tags,
})

export const pool: Question[] = [
  q('q1', 'Security', { services: ['lambda'], concepts: ['encryption'] }),
  q('q2', 'Security', { services: ['s3'] }),
  q('q3', 'Deployment', { concepts: ['encryption'] }),
  q('q4', 'Deployment', undefined),
  q('q5', 'Security', {
    services: ['container', 'ec2'],
    concepts: ['api-design'],
    questionTypes: ['troubleshooting'],
  }),
]

export const idsOf = (questions: readonly Question[]): string[] => questions.map((item) => item.id)

export const progress = (entries: Record<string, Partial<QuestionProgress>>): Record<string, QuestionProgress> =>
  Object.fromEntries(
    Object.entries(entries).map(([questionId, entry]) => [
      questionId,
      {
        questionId,
        attempts: 0,
        timesCorrect: 0,
        timesWrong: 0,
        flagged: false,
        lastSeenAt: 0,
        ...entry,
      },
    ]),
  )
