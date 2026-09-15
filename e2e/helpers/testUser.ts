export interface TestUser {
  email: string
  password: string
}

let callCounter = 0

export function newTestUserCredentials(): TestUser {
  const workerIndex = process.env.TEST_WORKER_INDEX ?? '0'
  callCounter++
  return {
    email: `e2e-w${workerIndex}-${callCounter}@example.com`,
    password: 'Passw0rd-E2e',
  }
}
