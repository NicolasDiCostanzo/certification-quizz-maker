import { beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn()
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn() }))
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  QueryCommand: class {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  },
}))

const { handler } = await import('./index')

const event = {
  requestContext: { authorizer: { jwt: { claims: { sub: 'user-1' } } } },
}

describe('pull handler', () => {
  beforeEach(() => {
    send.mockClear()
  })

  it('rejects a request without an authenticated user', async () => {
    const result = await handler({ requestContext: { authorizer: { jwt: { claims: { sub: '' } } } } })

    expect(result.statusCode).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('returns null progress and history when nothing is stored yet', async () => {
    send.mockResolvedValue({ Items: [] })

    const result = await handler(event)

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toEqual({ progress: null, history: null })
  })

  it('queries with strong consistency so a pull right after a push never reads a stale/missing item', async () => {
    send.mockResolvedValue({ Items: [] })

    await handler(event)

    expect(send.mock.calls[0][0].input).toMatchObject({ ConsistentRead: true })
  })

  it('maps the PROGRESS and HISTORY items to their fields', async () => {
    send.mockResolvedValue({
      Items: [
        { PK: 'SYNC#user-1', SK: 'PROGRESS', data: { byExamCode: {} } },
        { PK: 'SYNC#user-1', SK: 'HISTORY', data: { entries: [] } },
      ],
    })

    const result = await handler(event)

    expect(JSON.parse(result.body)).toEqual({ progress: { byExamCode: {} }, history: { entries: [] } })
  })

  it('returns 500 instead of throwing when DynamoDB is unavailable', async () => {
    send.mockRejectedValue(new Error('ProvisionedThroughputExceededException'))

    const result = await handler(event)

    expect(result.statusCode).toBe(500)
  })
})
