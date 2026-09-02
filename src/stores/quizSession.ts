import { defineStore } from 'pinia'
import type { Question, QuizConfig, QuizSessionState, ScoreResult } from '../types'

function isCorrect(question: Question, selected: string[]): boolean {
  const expected = Array.isArray(question.answers) ? question.answers : [question.answers]
  if (expected.length !== selected.length) return false
  const expectedSet = new Set(expected)
  const selectedSet = new Set(selected)
  return selectedSet.size === selected.length && selected.every((letter) => expectedSet.has(letter))
}

export const useQuizSessionStore = defineStore('quizSession', {
  state: (): { session: QuizSessionState | null } => ({
    session: null,
  }),

  getters: {
    hasSession: (state): boolean => state.session !== null && state.session.questions.length > 0,
    currentSession: (state): QuizSessionState | null => state.session,
    currentQuestion: (state): Question | null =>
      state.session?.questions[state.session.currentIndex] ?? null,
  },

  actions: {
    startSession(
      certCode: string,
      config: QuizConfig,
      questions: Question[],
      timeLimitMinutes: number | undefined,
    ) {
      const startedAt = Date.now()
      this.session = {
        certCode,
        mode: config.mode,
        questions,
        currentIndex: 0,
        answers: {},
        flags: [],
        startedAt,
        deadlineAt: config.mode === 'exam' && timeLimitMinutes ? startedAt + timeLimitMinutes * 60_000 : undefined,
        finished: false,
      }
    },

    answerQuestion(questionId: string, selected: string[]) {
      if (!this.session || this.session.finished) return
      const question = this.session.questions.find((item) => item.id === questionId)
      if (!question) return
      this.session.answers[questionId] = {
        selected,
        correct: isCorrect(question, selected),
        answeredAt: Date.now(),
      }
    },

    toggleFlag(questionId: string) {
      if (!this.session || this.session.finished) return
      const index = this.session.flags.indexOf(questionId)
      if (index >= 0) this.session.flags.splice(index, 1)
      else this.session.flags.push(questionId)
    },

    goToQuestion(index: number) {
      if (!this.session) return
      this.session.currentIndex = Math.max(0, Math.min(index, this.session.questions.length - 1))
    },

    nextQuestion() {
      this.goToQuestion((this.session?.currentIndex ?? 0) + 1)
    },

    previousQuestion() {
      this.goToQuestion((this.session?.currentIndex ?? 0) - 1)
    },

    finishSession(result: ScoreResult) {
      if (!this.session) return
      this.session.finished = true
      this.session.result = result
    },

    resetSession() {
      this.session = null
    },

    restoreSession(session: QuizSessionState) {
      this.session = session
    },
  },

  persist: { storage: sessionStorage },
})