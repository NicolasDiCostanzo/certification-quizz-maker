import { expect, test } from '@playwright/test'
import { texts } from '../src/texts/en'
import { resendConfirmationCode, resetPassword, seedConfirmedUser, signUpAndConfirm } from './helpers/authFlow'
import { newTestUserCredentials } from './helpers/testUser'

test('sign-up reaches the confirmation step, and confirming signs the user in automatically', async ({ page }) => {
  const { email, password } = newTestUserCredentials()

  await signUpAndConfirm(page, { email, password })

  await expect(page.locator('.account-chip__email')).toHaveText(email)
})

test('sign-in rejects a wrong password and an unknown email, then succeeds with the right credentials, survives a reload and signs out', async ({ page }) => {
  const { email, password } = newTestUserCredentials()
  await seedConfirmedUser(page, { email, password })

  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await expect(page.getByRole('heading', { name: texts.authSignInTitle })).toBeVisible()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(`${password}-wrong`)
  await page.getByRole('button', { name: texts.authSignInCta }).click()
  await expect(page.getByRole('alert')).toHaveText(texts.authSignInError)

  await page.locator('input[type="email"]').fill(`unknown-${email}`)
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
})

test('resending the confirmation code then confirming signs the user in', async ({ page }) => {
  await resendConfirmationCode(page, newTestUserCredentials())
})

test('resetting the password signs the user in, and the new password works after sign-out', async ({ page }) => {
  const user = newTestUserCredentials()
  await seedConfirmedUser(page, user)

  await resetPassword(page, user, `${user.password}-new`)
})

test('an account left unconfirmed is verified later from the sign-in form, then signs in', async ({ page }) => {
  const { email, password } = newTestUserCredentials()

  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeNewAccountCta }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignUpCta }).click()
  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.getByRole('button', { name: texts.authSwitchToConfirm }).click()

  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()
  await expect(page.getByText(texts.authCodeResent)).toBeVisible()

  await page.locator('input[autocomplete="one-time-code"]').fill('000000')
  await page.getByRole('button', { name: texts.authConfirmCta }).click()
  await expect(page.getByText(texts.authConfirmCompleted)).toBeVisible()

  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignInCta }).click()

  await expect(page).toHaveURL(/#\/cert$/)
  await expect(page.locator('.account-chip__email')).toHaveText(email)
})
