import { beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn().mockResolvedValue({})
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn() }))
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  TransactWriteCommand: class {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  },
}))

const { handler } = await import('./index')

const event = (body: unknown) => ({
  requestContext: { authorizer: { jwt: { claims: { sub: 'user-1' } } } },
  body: JSON.stringify(body),
})

const validProgress = { format: 'quiz-progress', version: 1, exportedAt: 'now', byExamCode: {} }
const validHistory = { format: 'quiz-history', version: 1, exportedAt: 'now', entries: [] }

describe('push handler payload validation', () => {
  beforeEach(() => {
    send.mockClear()
  })

  it.each([
    ['missing byExamCode', { ...validProgress, byExamCode: undefined }],
    ['missing format', { ...validProgress, format: undefined }],
    ['wrong version type', { ...validProgress, version: '1' }],
  ])('rejects a progress document with %s', async (_label, progress) => {
    const result = await handler(event({ progress }))

    expect(result.statusCode).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it.each([
    ['missing entries', { ...validHistory, entries: undefined }],
    ['entries not an array', { ...validHistory, entries: {} }],
  ])('rejects a history document with %s', async (_label, history) => {
    const result = await handler(event({ history }))

    expect(result.statusCode).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it('accepts a payload with valid progress and history documents', async () => {
    const result = await handler(event({ progress: validProgress, history: validHistory }))

    expect(result.statusCode).toBe(200)
    expect(send).toHaveBeenCalledOnce()
  })

  it('accepts a payload deleting a document (null value)', async () => {
    const result = await handler(event({ progress: null }))

    expect(result.statusCode).toBe(200)
    expect(send).toHaveBeenCalledOnce()
  })
})
