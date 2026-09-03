import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { QuizHistoryEntry } from '../types'

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
  },

  persist: true,
})
