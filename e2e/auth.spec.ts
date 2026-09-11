import { expect, test } from '@playwright/test'
import {
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'
import { texts } from '../src/texts/en'

const enabled =
  process.env.E2E_MODE === 'auth' &&
  !!process.env.VITE_AWS_REGION &&
  !!process.env.VITE_COGNITO_USER_POOL_ID &&
  !!process.env.VITE_COGNITO_CLIENT_ID

test.skip(!enabled, 'authenticated e2e requires E2E_MODE=auth plus VITE_AWS_REGION, VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID')

const client = new CognitoIdentityProviderClient({ region: process.env.VITE_AWS_REGION })
const userPoolId = process.env.VITE_COGNITO_USER_POOL_ID!
const password = 'Passw0rd-E2e'
const email = `e2e-${Date.now()}@example.com`

test.afterAll(async () => {
  await client.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: email }))
})

test('sign-up reaches the confirmation step, then the confirmed user signs in, survives a reload and signs out', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeNewAccountCta }).click()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignUpCta }).click()

  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()

  await client.send(new AdminConfirmSignUpCommand({ UserPoolId: userPoolId, Username: email }))

  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignInCta }).click()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.locator('.account-chip__email')).toHaveText(email)

  await page.reload()
  await expect(page.locator('.account-chip__email')).toHaveText(email)

  await page.getByRole('button', { name: texts.signOut }).click()
  await expect(page).toHaveURL(/#\/welcome/)
})