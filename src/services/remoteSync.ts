import { awsConfig } from '../config'
import type { HistoryExportFile, ProgressExportFile } from '../types'

export interface RemoteSyncPayload {
  progress: ProgressExportFile | null
  history: HistoryExportFile | null
}

export interface RemoteSyncAdapter {
  pull(): Promise<RemoteSyncPayload | null>
  push(payload: RemoteSyncPayload): Promise<void>
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

function createRemoteSyncAdapter(apiUrl: string): RemoteSyncAdapter {
  return {
    async pull() {
      const headers = await getAuthHeaders()
      const res = await fetch(apiUrl, { headers })
      if (res.status === 401) return null
      if (!res.ok) throw new Error(`sync pull failed: ${res.status}`)
      return await res.json()
    },
    async push(payload) {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) }
      const res = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`sync push failed: ${res.status}`)
    },
  }
}

export function getSyncAdapter(): RemoteSyncAdapter {
  return awsConfig.syncApiUrl ? createRemoteSyncAdapter(awsConfig.syncApiUrl) : localOnlySyncAdapter
}
