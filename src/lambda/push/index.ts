import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const tableName = process.env.TABLE_NAME!

interface SyncPayload {
  progress: unknown
  history: unknown
}

interface PutTransactItem {
  Put: { TableName: string; Item: Record<string, unknown> }
}

interface DeleteTransactItem {
  Delete: { TableName: string; Key: Record<string, string> }
}

const now = () => new Date().toISOString()

function isValidProgress(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.format === 'quiz-progress' &&
    typeof v.version === 'number' &&
    typeof v.exportedAt === 'string' &&
    typeof v.byExamCode === 'object' &&
    v.byExamCode !== null &&
    !Array.isArray(v.byExamCode)
  )
}

function isValidHistory(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.format === 'quiz-history' &&
    typeof v.version === 'number' &&
    typeof v.exportedAt === 'string' &&
    Array.isArray(v.entries)
  )
}

function recordCommand(
  kind: 'PROGRESS' | 'HISTORY',
  payload: unknown,
  pk: string,
  timestamp: string,
): PutTransactItem | DeleteTransactItem {
  const key = { PK: pk, SK: kind }
  if (payload === null) {
    return { Delete: { TableName: tableName, Key: key } }
  }
  return {
    Put: {
      TableName: tableName,
      Item: { ...key, data: payload, updatedAt: timestamp },
    },
  }
}

export const handler = async (event: {
  requestContext: { authorizer: { jwt: { claims: { sub: string } } } }
  body: string | null
}): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub
  if (!userId) return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: '' }

  let payload: SyncPayload
  try {
    const parsed: unknown = event.body ? JSON.parse(event.body) : {}
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Invalid request body' }),
      }
    }
    payload = parsed as SyncPayload
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Invalid JSON body' }),
    }
  }

  if ('progress' in payload && payload.progress !== null && !isValidProgress(payload.progress)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Invalid progress document' }),
    }
  }
  if ('history' in payload && payload.history !== null && !isValidHistory(payload.history)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Invalid history document' }),
    }
  }

  const pk = `SYNC#${userId}`
  const timestamp = now()

  const commands: (PutTransactItem | DeleteTransactItem)[] = []
  if ('progress' in payload) {
    commands.push(recordCommand('PROGRESS', payload.progress, pk, timestamp))
  }
  if ('history' in payload) {
    commands.push(recordCommand('HISTORY', payload.history, pk, timestamp))
  }

  if (commands.length > 0) {
    await docClient.send(new TransactWriteCommand({ TransactItems: commands }))
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  }
}