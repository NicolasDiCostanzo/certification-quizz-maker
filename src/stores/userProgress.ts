import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { ProgressExportFile, QuestionProgress, UserProgress } from '../types'

const EXPORT_FORMAT = 'quiz-progress'
const EXPORT_VERSION = 1

function newEntry(questionId: string): QuestionProgress {
  return { questionId, attempts: 0, timesCorrect: 0, timesWrong: 0, flagged: false, lastSeenAt: 0 }
}

export const useUserProgressStore = defineStore('userProgress', {
  state: (): UserProgress => ({
    byExamCode: {},
  }),

  getters: {
    isWrong: (state) => (examCode: string, questionId: string): boolean => {
      const entry = state.byExamCode[examCode]?.[questionId]
      return entry !== undefined && entry.timesWrong > entry.timesCorrect
    },
    isFlagged: (state) => (examCode: string, questionId: string): boolean =>
      state.byExamCode[examCode]?.[questionId]?.flagged ?? false,
    isUnattempted: (state) => (examCode: string, questionId: string): boolean =>
      (state.byExamCode[examCode]?.[questionId]?.attempts ?? 0) === 0,
    hasFlagged: (state) => (examCode: string): boolean => {
      const examProgress = state.byExamCode[examCode]
      if (!examProgress) return false
      return Object.values(examProgress).some(entry => entry.flagged)
    },
  },

  actions: {
    recordAnswer(examCode: string, questionId: string, correct: boolean) {
      const examProgress = (this.byExamCode[examCode] ??= {})
      const entry = (examProgress[questionId] ??= newEntry(questionId))
      entry.attempts += 1
      if (correct) entry.timesCorrect += 1
      else entry.timesWrong += 1
      entry.lastSeenAt = Date.now()
    },

    toggleFlag(examCode: string, questionId: string) {
      const examProgress = (this.byExamCode[examCode] ??= {})
      const entry = (examProgress[questionId] ??= newEntry(questionId))
      entry.flagged = !entry.flagged
      entry.lastSeenAt = Date.now()
    },

    exportProgress(): ProgressExportFile {
      return {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        byExamCode: JSON.parse(JSON.stringify(this.byExamCode)) as UserProgress['byExamCode'],
      }
    },

    importProgress(file: ProgressExportFile) {
      if (file.format !== EXPORT_FORMAT || file.version !== EXPORT_VERSION) return
      for (const [examCode, questions] of Object.entries(file.byExamCode)) {
        const examProgress = (this.byExamCode[examCode] ??= {})
        for (const [questionId, incoming] of Object.entries(questions)) {
          const existing = examProgress[questionId]
          if (!existing || incoming.lastSeenAt > existing.lastSeenAt) {
            examProgress[questionId] = incoming
          }
        }
      }
    },

    resetByCertCode(examCode: string) {
      delete this.byExamCode[examCode]
    },

    resetAll() {
      this.byExamCode = {}
    },
  },

  persist: true,
})
