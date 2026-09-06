import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { HistoryExportFile, QuizHistoryEntry } from '../types'

const EXPORT_FORMAT = 'quiz-history'
const EXPORT_VERSION = 1

export const useQuizHistoryStore = defineStore('quizHistory', {
  state: (): { entries: QuizHistoryEntry[] } => ({
    entries: [],
  }),

  getters: {
    byCertCode: (state) => (certCode: string): QuizHistoryEntry[] =>
      state.entries
        .filter((e) => e.certCode === certCode)
        .sort((a, b) => b.finishedAt - a.finishedAt),

    allTimeCorrect: (state) => (certCode: string): number =>
      state.entries
        .filter((e) => e.certCode === certCode)
        .reduce((sum, e) => sum + e.result.timesCorrect, 0),

    allTimeAttempted: (state) => (certCode: string): number =>
      state.entries
        .filter((e) => e.certCode === certCode)
        .reduce((sum, e) => sum + e.result.totalAnswered, 0),
  },

  actions: {
    record(entry: QuizHistoryEntry) {
      this.entries.push(entry)
    },

    deleteById(id: string) {
      const index = this.entries.findIndex((e) => e.id === id)
      if (index >= 0) this.entries.splice(index, 1)
    },

    resetByCertCode(certCode: string) {
      this.entries = this.entries.filter((e) => e.certCode !== certCode)
    },

    resetAll() {
      this.entries = []
    },

    exportHistory(): HistoryExportFile {
      return {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        entries: JSON.parse(JSON.stringify(this.entries)) as QuizHistoryEntry[],
      }
    },

    importHistory(file: HistoryExportFile) {
      if (file.format !== EXPORT_FORMAT || file.version !== EXPORT_VERSION) return
      const existingIds = new Set(this.entries.map((e) => e.id))
      for (const entry of file.entries) {
        if (!existingIds.has(entry.id)) {
          this.entries.push(entry)
          existingIds.add(entry.id)
        }
      }
    },
  },

  persist: true,
})
