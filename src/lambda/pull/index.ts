import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const tableName = process.env.TABLE_NAME!

interface SyncResponse {
  progress: unknown
  history: unknown
}

export const handler = async (event: {
  requestContext: { authorizer: { jwt: { claims: { sub: string } } } }
}): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub
  if (!userId) return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: '' }

  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `SYNC#${userId}` },
    }),
  )

  const response: SyncResponse = { progress: null, history: null }
  for (const item of result.Items ?? []) {
    if (item.SK === 'PROGRESS') response.progress = item.data
    if (item.SK === 'HISTORY') response.history = item.data
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  }
}