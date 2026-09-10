import { awsConfig, isSyncConfigured } from '../config'
import type { HistoryExportFile, ProgressExportFile } from '../types'

export interface RemoteSyncPayload {
  progress: ProgressExportFile | null
  history: HistoryExportFile | null
}

export interface RemoteSyncAdapter {
  pull(signal?: AbortSignal): Promise<RemoteSyncPayload | null>
  push(payload: RemoteSyncPayload, isCurrent?: () => boolean, signal?: AbortSignal): Promise<void>
}

const localOnlySyncAdapter: RemoteSyncAdapter = {
  async pull() {
    return null
  },
  async push() {},
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { fetchAuthSession } = await import('aws-amplify/auth')
  const { tokens } = await fetchAuthSession()
  return tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken.toString()}` } : {}
}

function validatePullPayload(value: unknown): RemoteSyncPayload | null {
  if (value === null) return null
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('sync pull failed: invalid payload shape')
  }
  const v = value as Record<string, unknown>
  if (!('progress' in v)) {
    throw new Error('sync pull failed: missing progress')
  }
  if (v.progress !== null) {
    if (typeof v.progress !== 'object' || Array.isArray(v.progress)) {
      throw new Error('sync pull failed: invalid progress document')
    }
    const progress = v.progress as Record<string, unknown>
    if (
      typeof progress.byExamCode !== 'object' ||
      progress.byExamCode === null ||
      Array.isArray(progress.byExamCode)
    ) {
      throw new Error('sync pull failed: invalid progress.byExamCode')
    }
  }
  if (!('history' in v)) {
    throw new Error('sync pull failed: missing history')
  }
  if (v.history !== null) {
    if (typeof v.history !== 'object' || Array.isArray(v.history)) {
      throw new Error('sync pull failed: invalid history document')
    }
    const history = v.history as Record<string, unknown>
    if (!Array.isArray(history.entries)) {
      throw new Error('sync pull failed: invalid history.entries')
    }
  }
  return v as unknown as RemoteSyncPayload
}

function createRemoteSyncAdapter(apiUrl: string): RemoteSyncAdapter {
  return {
    async pull(signal) {
      const headers = await getAuthHeaders()
      const res = await fetch(apiUrl, { headers, signal })
      if (res.status === 401) throw new Error('sync pull failed: 401')
      if (!res.ok) throw new Error(`sync pull failed: ${res.status}`)
      return validatePullPayload(await res.json())
    },
    async push(payload, isCurrent, signal) {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) }
      if (isCurrent && !isCurrent()) return
      const res = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(payload), signal })
      if (!res.ok) throw new Error(`sync push failed: ${res.status}`)
    },
  }
}

export function getSyncAdapter(): RemoteSyncAdapter {
  if (isSyncConfigured() && awsConfig.syncApiUrl) {
    return createRemoteSyncAdapter(awsConfig.syncApiUrl)
  }
  return localOnlySyncAdapter
}
