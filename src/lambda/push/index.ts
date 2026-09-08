import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const tableName = process.env.TABLE_NAME!

interface SyncPayload {
  progress: unknown
  history: unknown
}

export const handler = async (event: {
  requestContext: { authorizer: { jwt: { claims: { sub: string } } } }
  body: string | null
}): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub
  if (!userId) return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: '' }

  const payload = (event.body ? JSON.parse(event.body) : {}) as SyncPayload
  const now = new Date().toISOString()

  if (payload.progress) {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: { PK: `SYNC#${userId}`, SK: 'PROGRESS', data: payload.progress, updatedAt: now },
      }),
    )
  }

  if (payload.history) {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: { PK: `SYNC#${userId}`, SK: 'HISTORY', data: payload.history, updatedAt: now },
      }),
    )
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  }
}