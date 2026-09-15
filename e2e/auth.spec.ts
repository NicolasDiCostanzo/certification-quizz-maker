import { expect, test } from '@playwright/test'
import { texts } from '../src/texts/en'
import { authEnabled, authSkipReason, confirmTestUser, deleteTestUser, newTestUserCredentials } from './helpers/cognitoTestUser'

test.skip(!authEnabled, authSkipReason)

const { email, password } = newTestUserCredentials()
const wrongPassword = `${password}-wrong`
const unknownEmail = `e2e-unknown-${Date.now()}@example.com`

test.afterAll(async () => {
  await deleteTestUser(email)
})

test('sign-up reaches the confirmation step, then the confirmed user signs in, survives a reload and signs out', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeNewAccountCta }).click()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignUpCta }).click()

  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()

  await confirmTestUser(email)

  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await expect(page.getByRole('heading', { name: texts.authSignInTitle })).toBeVisible()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(wrongPassword)
  await page.getByRole('button', { name: texts.authSignInCta }).click()
  await expect(page.getByRole('alert')).toHaveText(texts.authSignInError)

  await page.locator('input[type="email"]').fill(unknownEmail)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignInCta }).click()
  await expect(page.getByRole('alert')).toHaveText(texts.authSignInError)

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignInCta }).click()

  await expect(page).toHaveURL(/#\/cert$/)
  await expect(page.locator('.account-chip__email')).toHaveText(email)

  await page.reload()
  await expect(page.locator('.account-chip__email')).toHaveText(email)

  await page.getByRole('button', { name: texts.signOut }).click()
  await expect(page).toHaveURL(/\/#\/$/)
  const signedOutUrl = new URL(page.url())
  expect(signedOutUrl.pathname).toBe('/')
  expect(signedOutUrl.hash).toBe('#/')
})
