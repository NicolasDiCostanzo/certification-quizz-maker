import type {
  CertBundle,
  Question,
  QuestionProgress,
  ReplayMode,
  ThemeGroupFilter,
  ThemeMatchMode,
} from '../types'

const noProgress: Record<string, QuestionProgress> = {}

function hasRequiredTags(question: Question, group: string, filter: ThemeGroupFilter): boolean {
  const tags: string[] | undefined = question.themes?.[group]
  if (!tags || tags.length === 0) return false
  return filter.match === 'all'
    ? filter.values.every((value) => tags.includes(value))
    : filter.values.some((value) => tags.includes(value))
}

function matchesInclude(
  question: Question,
  include: Record<string, ThemeGroupFilter>,
  matchMode: ThemeMatchMode,
): boolean {
  const groups = Object.entries(include).filter(([, filter]) => filter.values.length > 0)
  if (groups.length === 0) return true

  const matches = ([group, filter]: [string, ThemeGroupFilter]) =>
    hasRequiredTags(question, group, filter)

  return matchMode === 'and' ? groups.every(matches) : groups.some(matches)
}

function matchesExclude(question: Question, exclude: Record<string, ThemeGroupFilter>): boolean {
  return Object.entries(exclude).every(
    ([group, filter]) =>
      filter.values.length === 0 || !hasRequiredTags(question, group, filter),
  )
}

function isTaggedIn(question: Question): boolean {
  const themes = question.themes
  if (!themes) return false
  return Object.values(themes).some((values) => values.length > 0)
}

export function filterByThemes(
  questions: readonly Question[],
  include: Record<string, ThemeGroupFilter> = {},
  matchMode: ThemeMatchMode = 'and',
  exclude: Record<string, ThemeGroupFilter> = {},
): Question[] {
  const includeActive = Object.values(include).some((filter) => filter.values.length > 0)

  return questions.filter((question) => {
    if (includeActive && !isTaggedIn(question)) return false
    return matchesInclude(question, include, matchMode) && matchesExclude(question, exclude)
  })
}

export function filterByTopics(
  questions: readonly Question[],
  topics: readonly string[] | undefined,
): Question[] {
  if (!topics || topics.length === 0) return [...questions]
  const allowed = new Set(topics)
  return questions.filter((question) => allowed.has(question.topic))
}

export function filterByReplay(
  questions: readonly Question[],
  replayMode: ReplayMode,
  progress: Record<string, QuestionProgress> = noProgress,
): Question[] {
  if (replayMode === 'all') return [...questions]
  return questions.filter((question) => {
    const entry = progress[question.id]
    switch (replayMode) {
      case 'unattempted':
        return entry === undefined || entry.attempts === 0
      case 'wrong':
        return entry !== undefined && entry.timesWrong > entry.timesCorrect
      case 'flagged':
        return entry !== undefined && entry.flagged === true
      default:
        return true
    }
  })
}

export interface BuildPoolOptions {
  includeThemes?: Record<string, ThemeGroupFilter>
  includeMatchMode?: ThemeMatchMode
  excludeThemes?: Record<string, ThemeGroupFilter>
  topics?: string[]
  replayMode?: ReplayMode
  progress?: Record<string, QuestionProgress>
}

export function buildQuestionPool(
  bundle: Pick<CertBundle, 'questions'>,
  options: BuildPoolOptions = {},
): Question[] {
  const {
    includeThemes = {},
    includeMatchMode = 'and',
    excludeThemes = {},
    topics,
    replayMode = 'all',
    progress = noProgress,
  } = options

  return filterByReplay(
    filterByTopics(
      filterByThemes(bundle.questions, includeThemes, includeMatchMode, excludeThemes),
      topics,
    ),
    replayMode,
    progress,
  )
}
