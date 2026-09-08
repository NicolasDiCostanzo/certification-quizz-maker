import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const tableName = process.env.TABLE_NAME!

interface SyncPayload {
  progress: unknown
  history: unknown
}

const now = () => new Date().toISOString()

function recordCommand(
  kind: 'PROGRESS' | 'HISTORY',
  payload: unknown,
  pk: string,
  timestamp: string,
): PutCommand | DeleteCommand {
  const key = { PK: pk, SK: kind }
  if (payload === null) {
    return new DeleteCommand({ TableName: tableName, Key: key })
  }
  return new PutCommand({
    TableName: tableName,
    Item: { ...key, data: payload, updatedAt: timestamp },
  })
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

  const pk = `SYNC#${userId}`
  const timestamp = now()

  const commands: (PutCommand | DeleteCommand)[] = []
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