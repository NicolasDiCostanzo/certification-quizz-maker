import {
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'

export const authEnabled =
  process.env.E2E_MODE === 'auth' &&
  !!process.env.VITE_AWS_REGION &&
  !!process.env.VITE_COGNITO_USER_POOL_ID &&
  !!process.env.VITE_COGNITO_CLIENT_ID

export const authSkipReason =
  'authenticated e2e requires E2E_MODE=auth plus VITE_AWS_REGION, VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID'

const client = new CognitoIdentityProviderClient({ region: process.env.VITE_AWS_REGION })
const userPoolId = process.env.VITE_COGNITO_USER_POOL_ID!

export interface TestUser {
  email: string
  password: string
}

let callCounter = 0

export function newTestUserCredentials(): TestUser {
  const workerIndex = process.env.PLAYWRIGHT_WORKER_INDEX ?? '0'
  callCounter++
  return {
    email: `e2e-w${workerIndex}-${callCounter}@example.com`,
    password: 'Passw0rd-E2e',
  }
}

export async function confirmTestUser(email: string): Promise<void> {
  await client.send(new AdminConfirmSignUpCommand({ UserPoolId: userPoolId, Username: email }))
}

export async function deleteTestUser(email: string): Promise<void> {
  try {
    await client.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: email }))
  } catch (err) {
    if (err?.name !== 'UserNotFoundException') throw err
  }
}
