import type { HistoryExportFile, ProgressExportFile } from '../types'

export interface RemoteSyncPayload {
  progress: ProgressExportFile
  history: HistoryExportFile
}

export interface RemoteSyncAdapter {
  pull(): Promise<RemoteSyncPayload | null>
  push(payload: RemoteSyncPayload): Promise<void>
}

const localOnlySyncAdapter: RemoteSyncAdapter = {
  async pull() {
    return null
  },
  async push() {
    // No-op until the AWS backend (Cognito + API Gateway + Lambda + DynamoDB) exists.
  },
}

export function getSyncAdapter(): RemoteSyncAdapter {
  return localOnlySyncAdapter
}
