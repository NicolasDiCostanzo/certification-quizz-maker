// Cert bundle (see docs/DATA-MODEL.md)

export interface PassingScore {
  passingScore: number
  scale?: number
}

export interface ExamInfo {
  name: string
  code: string
  totalQuestions: number
  timeLimitMinutes: number
  passingScore: PassingScore
  weights?: Record<string, number>
  instructions?: string
}

export type ThemeRegistry = Record<string, string[]>

export type QuestionThemes = Record<string, string[]>

export interface Question {
  id: string
  question: string
  options: string[]
  answers: string | string[]
  topic: string
  url?: string
  explanation?: string
  promptImages?: string[]
  themes?: QuestionThemes
}

export interface CertBundle {
  version: number
  exam: ExamInfo
  themes: ThemeRegistry
  questions: Question[]
}

// User progress (see docs/DATA-MODEL.md)

export interface QuestionProgress {
  questionId: string
  attempts: number
  timesCorrect: number
  timesWrong: number
  flagged: boolean
  lastSeenAt: number
}

export interface UserProgress {
  byExamCode: Record<string, Record<string, QuestionProgress>>
}

export interface ProgressExportFile {
  format: 'quiz-progress'
  version: number
  exportedAt: string
  byExamCode: UserProgress['byExamCode']
}

// Quiz configuration and session

export type QuizMode = 'preparation' | 'exam'
export type ReplayMode = 'all' | 'wrong' | 'flagged' | 'unattempted'
export type ThemeMatchMode = 'and' | 'or'

export interface QuizConfig {
  certCode: string
  mode: QuizMode
  includeThemes?: Record<string, string[]>
  includeMatchMode: ThemeMatchMode
  excludeThemes?: Record<string, string[]>
  topics?: string[]
  replayMode: ReplayMode
  count: number | 'all'
}

export interface QuestionAnswer {
  selected: string[]
  correct: boolean
  answeredAt: number
}

export interface ScoreResult {
  percentCorrect: number
  passed: boolean
  timesCorrect: number
  totalAnswered: number
  projectedScaledScore?: number
  disclaimer?: string
}

export interface QuizSessionState {
  certCode: string
  mode: QuizMode
  questions: Question[]
  currentIndex: number
  answers: Record<string, QuestionAnswer>
  flags: string[]
  startedAt: number
  deadlineAt?: number
  finished: boolean
  result?: ScoreResult
}
