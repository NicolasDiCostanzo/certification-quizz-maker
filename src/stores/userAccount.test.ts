import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { HistoryExportFile, ProgressExportFile } from '../types'
import { useUserAccountStore } from './userAccount'

function createTestPinia() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({ render: () => null }).use(pinia)
  setActivePinia(pinia)
  return pinia
}

beforeEach(() => {
  localStorage.clear()
  createTestPinia()
})

describe('userAccount store', () => {
  it('starts with no account mode chosen', () => {
    expect(useUserAccountStore().accountMode).toBeNull()
  })

  it('persists the chosen account mode into a fresh Pinia instance', async () => {
    useUserAccountStore().accountMode = 'local'
    await nextTick()

    createTestPinia()

    expect(useUserAccountStore().user).toBeNull()
    expect(useUserAccountStore().accountMode).toBe('local')
  })

  it('persists the signed-in user into a fresh Pinia instance', async () => {
    useUserAccountStore().user = { userId: 'sub-1', email: 'dev@example.com' }
    await nextTick()

    createTestPinia()

    expect(useUserAccountStore().user).toEqual({ userId: 'sub-1', email: 'dev@example.com' })
  })

  it('takeGuestSnapshot returns the stashed guest data and clears it', () => {
    const store = useUserAccountStore()
    const progress = { format: 'quiz-progress', version: 1, exportedAt: 'now', byExamCode: {} } as ProgressExportFile
    const history = { format: 'quiz-history', version: 1, exportedAt: 'now', entries: [] } as HistoryExportFile

    store.stashGuest(progress, history)
    const snapshot = store.takeGuestSnapshot()

    expect(snapshot.progress).toStrictEqual(progress)
    expect(snapshot.history).toStrictEqual(history)
    expect(store.guestProgress).toBeNull()
    expect(store.guestHistory).toBeNull()
  })

  it('takeGuestSnapshot returns nulls when nothing was stashed', () => {
    const snapshot = useUserAccountStore().takeGuestSnapshot()

    expect(snapshot.progress).toBeNull()
    expect(snapshot.history).toBeNull()
  })
})
